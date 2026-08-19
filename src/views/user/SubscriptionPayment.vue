<template>
  <div class="subscription-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="content-box">
        <div class="page-title-tabs">
          <div v-if="bloggerStatus === 1" class="tab-item" :class="{ active: paymentTab === 'cash' }" @click="paymentTab = 'cash'">{{ t("subscribe.cashPay") }}</div>
          <div class="tab-item" :class="{ active: paymentTab === 'usdt' }" @click="paymentTab = 'usdt'">{{ t("subscribe.usdtPay") }}</div>
        </div>

        <!-- Creator Info -->
        <div class="creator-info">
          <div class="info-left">
            <img :src="userInfo.avatar" class="avatar" />
            <div class="meta">
              <div class="nickname">{{ userInfo.nickname }}</div>
            </div>
          </div>
          <div class="price-tag">
            <span v-if="paymentTab === 'usdt'">{{ subscriptionWeb3Price }} USDT</span>
            <span v-else>{{ subscriptionPrice }} {{t('aiRecharge.unit')}}</span>
            /{{ t("subscribe.month") }}
          </div>
        </div>

        <p v-if="subscriptionDescription" class="plan-desc">{{ subscriptionDescription }}</p>

        <p class="desc">{{ paymentTab === 'usdt' ? t('subscribe.usdtNote') : t('subscribe.desc') }}</p>

        <!-- Agreements -->
        <div class="agreements">
          <div class="check-item">
            <div class="checkbox" @click="paymentAgree = !paymentAgree">
              <img v-if="paymentAgree" src="@/assets/images/register/check_active.png" alt="" />
              <img v-else src="@/assets/images/register/check.png" alt="" />
            </div>

            <span>
              {{ t("subscribe.agree") }}
              <span class="agreement-text">{{ t("subscribe.paymentTerms") }}</span>
            </span>
          </div>
        </div>

        <!-- Pay Button -->
        <button class="pay-btn" :disabled="isLoading" @click="handlePay">
          {{ t("subscribe.pay") }}
        </button>

        <!-- Auto-renewal Note -->
        <div v-if="paymentTab !== 'usdt'" class="auto-renewal-note">
          {{ t('subscribe.autoRenewalNote') }}
        </div>
      </div>
    </div>

    <!-- Loading Mask -->
    <UploadMask :visible="isLoading" :text="t('loading')" />

    <!-- Wallet Select Modal -->
    <WalletSelectModal
      :visible="showWalletModal"
      @close="showWalletModal = false"
      @select="handleWalletSelect"
      @noWallet="handleNoWallet"
    />
  </div>
</template>

<script setup lang="ts" name="SubscriptionPayment">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";
import WalletSelectModal from "@/components/WalletSelectModal.vue";
import defaultAvatar from "@/assets/images/base/avatar.png";
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import api from "@/api/index";
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import erc20Abi from "@/util/abi/erc20Abi.json";
import { USDT_CONTRACT_ADDRESS, BSC_TESTNET_CHAIN_ID, PAY_NETWORK, SUBSCRIPTION_RECEIVER_ADDRESS } from "@/util/config";
import { connectWalletConnect, getWalletConnectProvider } from "@/util/walletconnect";

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const WALLET_SIGN_MSG = 'Welcome to our dApp! Please sign this message to prove ownership of your wallet.';

const USDT_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  }
];

const userInfo = ref({
  id: "",
  nickname: "",
  avatar: ""
});

interface SubscriptionPlan {
  price: string;
  web3?: { price?: string };
  id?: number;
  name?: string;
  description?: string;
}

const subscriptionPlans = ref<SubscriptionPlan | SubscriptionPlan[]>({
  price: ''
});

const paymentTab = ref<'cash' | 'usdt'>('cash');
const bloggerStatus = ref<number>(0);
const paymentAgree = ref(true);
const isLoading = ref(false);
const showWalletModal = ref(false);

const subscriptionDescription = computed(() => {
  const plans = subscriptionPlans.value;
  if (Array.isArray(plans)) {
    return plans.length > 0 ? plans[0].description || '' : '';
  } else {
    return plans.description || '';
  }
});

const subscriptionPrice = computed(() => {
  const plans = subscriptionPlans.value;
  if (Array.isArray(plans)) {
    return plans.length > 0 ? plans[0].price : '';
  } else {
    return plans.price || '';
  }
});

const subscriptionWeb3Price = computed(() => {
  const plans = subscriptionPlans.value;
  if (Array.isArray(plans)) {
    return plans.length > 0 ? plans[0].web3?.price || '' : '';
  } else {
    return plans.web3?.price || '';
  }
});

function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

async function fetchAuthorInfo() {
  const uid = route.query.id;
  if (!uid) {
    toast(t("fail"));
    return;
  }

  const userId = Array.isArray(uid) ? uid[0] : uid;
  if (!userId) {
    toast(t("fail"));
    return;
  }

  try {
    const res = await api.authorInfo(userId);
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      userInfo.value = {
        id: data.data?.user?.id || "",
        nickname: data.data?.user?.nickname || "",
        avatar: data.data?.user?.avatar || defaultAvatar,
      };

      subscriptionPlans.value = data.data?.subscription_plans || [];

      const status = data.data?.blogger_status ?? data.data?.user?.blogger_status;
      bloggerStatus.value = Number(status) || 0;
      if (bloggerStatus.value === 0) {
        paymentTab.value = 'usdt';
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    console.error("Fetch author info error:", error);
    toast(t("fail"));
  }
}

async function handlePay() {
  if (!checkLogin()) return;

  if (!paymentAgree.value) {
    toast(t("subscribe.agreeFirst"));
    return;
  }

  if (paymentTab.value === 'usdt') {
    showWalletModal.value = true;
    return;
  }

  try {
    isLoading.value = true;

    const uid = route.query.id;
    if (!uid) {
      toast(t("fail"));
      return;
    }

    const userId = Array.isArray(uid) ? uid[0] : uid;
    if (!userId) {
      toast(t("fail"));
      return;
    }

    const res = await api.subscribe({ creator_id: userId });
    const data = res as any;
    if (data.code === 0 || data.code === 200) {
      window.location.href = data.data?.url;
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    isLoading.value = false;
  }
}

async function handleWalletSelect(wallet: { id: string; name: string }) {
  showWalletModal.value = false;

  if (!checkLogin()) return;

  try {
    let walletProvider: any;
    let account: string;

    if (wallet.id === 'walletconnect') {
      try {
        const accounts = await connectWalletConnect();
        if (!accounts || accounts.length === 0) {
          return;
        }
        walletProvider = getWalletConnectProvider();
        account = accounts[0];
      } catch (error) {
        return;
      }
    } else {
      isLoading.value = true;
      walletProvider = getWalletProvider(wallet.id);
      if (!walletProvider) {
        toast(t("fail"));
        isLoading.value = false;
        return;
      }

      await switchChain(walletProvider);

      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        toast(t("fail"));
        isLoading.value = false;
        return;
      }
      account = accounts[0];
    }

    isLoading.value = true;

    const uid = route.query.id;
    if (!uid) {
      toast(t("fail"));
      return;
    }

    const userId = Array.isArray(uid) ? uid[0] : uid;
    if (!userId) {
      toast(t("fail"));
      return;
    }

    const params = {
      blogger_id: userId,
      address: account,
    };

    const res = await api.generateUBloggerSubOrder(params);
    const data = res as any;
    if (data.code == 0 || data.code == 200) {
      const orderId = data.data?.order_id || '';
      const usdtAmount = subscriptionWeb3Price.value;
      if (usdtAmount && parseFloat(usdtAmount) > 0) {
        const txHash = await transferUSDT(walletProvider, account, usdtAmount);
        if (txHash && orderId) {
          await api.webThreeCallbackUPaid({ order_id: orderId, tx_hash: txHash }).catch(() => {});
          router.push('/subscription-success');
          return;
        } else {
          router.push('/subscription-fail');
          return;
        }
      }
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
    router.push('/subscription-fail');
  } finally {
    isLoading.value = false;
  }
}

async function transferUSDT(provider: any, fromAddress: string, amount: string): Promise<string | null> {
  try {
    const web3 = new Web3(provider);
    const tokenContract = new web3.eth.Contract(erc20Abi as any, USDT_CONTRACT_ADDRESS);

    const decimals: number = await tokenContract.methods.decimals().call();

    // 余额检查
    const balance: string = await tokenContract.methods.balanceOf(fromAddress).call();
    const needAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimals));
    if (new BigNumber(balance).isLessThan(needAmount)) {
      toast(t('subscribe.insufficientUsdtBalance'));
      return null;
    }

    // 使用 Web3.js Contract 发起 transfer，与 MetaMask 兼容性最好
    const receipt: any = await tokenContract.methods
      .transfer(SUBSCRIPTION_RECEIVER_ADDRESS, needAmount.toFixed())
      .send({ from: fromAddress });

    const txHash = receipt?.transactionHash || receipt?.status?.transactionHash || null;
    if (txHash) {
      toast(t('success'));
      return txHash;
    } else {
      toast(t("fail"));
      return null;
    }
  } catch (error: any) {
    console.error('USDT transfer error:', error);
    const errMsg = error?.data?.message || error?.message || '';
    if (errMsg.toLowerCase().includes('insufficient')) {
      toast(t('subscribe.insufficientUsdtOrGas'));
    } else if (errMsg) {
      toast(errMsg);
    } else {
      toast(t("fail"));
    }
    return null;
  }
}

function getWalletProvider(walletId: string): any {
  const w = window as any;
  switch (walletId) {
    case 'metamask':
      return w.ethereum || null;
    case 'okx':
      return w.okxwallet || null;
    case 'phantom':
      return w.phantom?.ethereum || null;
    default:
      return null;
  }
}

async function switchChain(provider: any) {
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (chainId !== BSC_TESTNET_CHAIN_ID) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CHAIN_ID }],
      });
    } catch (switchError: any) {
      console.error('Switch chain error:', switchError);
      throw switchError;
    }
  }
}

function handleNoWallet() {
  window.open('https://ethereum.org/en/wallets/', '_blank');
}

onMounted(() => {
  if (!checkLogin()) return;
  fetchAuthorInfo();
});
</script>

<style scoped lang="scss">
.subscription-page {
  width: 100%;
  background: #FFFDF7;
}

.container {
  max-width: 650px;
  margin: 140px auto 20px;
  position: relative;

  .back {
    position: absolute;
    top: -52px;
    left: 0;
    width: auto;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #161122;
    cursor: pointer;
    z-index: 10;
    border: 2.5px solid #161122;
    border-radius: 13px;
    box-shadow: 3px 3px 0 #161122;
    background: #FFFDF7;
    padding: 0 10px;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    .back-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 4px 4px 0 #161122;
    }
  }
}

.content-box {
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  padding: 24px;
  background: #FFFDF7;

  .page-title-tabs {
    width: max-content;
    display: flex;
    border: 2.5px solid #161122;
    border-radius: 14px;
    padding: 5px;
    margin-bottom: 24px;

    .tab-item {
      display: flex;
      align-items: center;
      height: 36px;
      font-size: 14px;
      font-weight: 800;
      color: #161122;
      cursor: pointer;
      padding: 0 20px;
      border-radius: 10px;
      transition: background-color 0.16s, color 0.16s;
      background: transparent;

      &.active {
        background: #161122;
        color: #fff;
      }

      &:hover:not(.active) {
        background: #FFFDF7;
      }
    }
  }

  .creator-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 0;
    background: transparent;

    .info-left {
      display: flex;
      gap: 8px;
      align-items: center;

      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        object-fit: cover;
        border: 2.5px solid #161122;
      }

      .meta {
        .nickname {
          font-size: 16px;
          font-weight: 800;
          color: #161122;
          margin-bottom: 4px;
        }

        .id {
          font-size: 14px;
          color: #161122;
        }
      }
    }

    .price-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 128px;
      height: 48px;
      padding: 8px 16px;
      background: #00D3F2;
      color: #FFFFFF;
      border-radius: 6px;
      font-weight: 800;
      font-size: 14px;
      border: 2.5px solid #161122;

      span {
        font-size: 18px;
      }
    }
  }

  .plan-desc {
    font-size: 14px;
    color: #161122;
    line-height: 20px;
    margin-bottom: 12px;
  }

  .desc {
    font-size: 14px;
    color: #161122;
    line-height: 20px;
    margin-bottom: 24px;
  }

  .agreements {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #161122;

      .checkbox {
        width: 22px;
        height: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 22px;
          height: 22px;
        }
      }

      .agreement-text {
        color: #FF4D8D;
        font-weight: 800;
        margin-left: 4px;
      }
    }
  }

  .pay-btn {
    width: 100%;
    height: 48px;
    background: #FF4D8D;
    color: #FFFDF7;
    border: 2.5px solid #161122;
    border-radius: 13px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.1s, box-shadow 0.1s;

    &:hover {
      box-shadow: 1px 1px 0 #161122;
      transform: translate(2px, 2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  }

  .auto-renewal-note {
    margin-top: 12px;
    font-size: 12px;
    color: #161122;
    line-height: 18px;
  }
}

@media (max-width: 768px) {
  .container {
    margin: 140px 20px 20px;
  }
  .creator-info {
    gap: 12px;
    align-items: flex-start;
  }
  .price-tag {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .container {
    margin: 120px 12px 16px;
  }
  .content-box .page-title {
    font-size: 18px;
  }
  .content-box .creator-info {
    padding: 12px;
  }
  .content-box .creator-info .info-left .avatar {
    width: 40px;
    height: 40px;
  }
  .content-box .creator-info .price-tag {
    min-width: auto;
    height: 36px;
    padding: 6px 12px;
    font-size: 13px;
    span {
      font-size: 15px;
    }
  }
  .container .back {
    top: -44px;
    width: auto;
    height: 36px;
  }
}
</style>
