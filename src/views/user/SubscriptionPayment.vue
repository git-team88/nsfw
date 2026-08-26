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
import { USDT_CONTRACT_ADDRESS, SUBSCRIPTION_RECEIVER_ADDRESS } from "@/util/config";
import { connectWalletConnect, getWalletConnectProvider } from "@/util/walletconnect";
import { getWalletProvider, ensureChain, checkUsdtBalance } from "@/util/wallet";

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
  const raw = Array.isArray(plans) ? (plans.length > 0 ? plans[0].price : '') : (plans.price || '');
  if (!raw) return '';
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  const trimmed = parseFloat(num.toFixed(8)).toString();
  const parts = trimmed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
});

const subscriptionWeb3Price = computed(() => {
  const plans = subscriptionPlans.value;
  const raw = Array.isArray(plans) ? (plans.length > 0 ? plans[0].web3?.price || '' : '') : (plans.web3?.price || '');
  if (!raw) return '';
  const num = parseFloat(raw);
  if (isNaN(num)) return raw;
  const trimmed = parseFloat(num.toFixed(8)).toString();
  const parts = trimmed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
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

      const chainOk = await ensureChain(walletProvider);
      if (!chainOk) {
        isLoading.value = false;
        return;
      }

      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        toast(t("fail"));
        isLoading.value = false;
        return;
      }
      account = accounts[0];
    }

    isLoading.value = true;

    const usdtAmount = subscriptionWeb3Price.value;
    console.log('[SubscriptionPayment] usdtAmount:', usdtAmount);

    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast(t("fail"));
      isLoading.value = false;
      return;
    }

    const balanceOk = await checkUsdtBalance(walletProvider, account, usdtAmount);
    if (!balanceOk) {
      isLoading.value = false;
      return;
    }

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
    const needAmount = new BigNumber(amount).times(new BigNumber(10).pow(decimals));

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
    color: #f5f5f5;
    cursor: pointer;
    z-index: 10;
    border: 1px solid #3d3d3d;
    border-radius: 14px;
    box-shadow: none;
    background: #1a1a1a;
    padding: 0 10px;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);

    .back-text {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
    }

    &:hover {
      
      background: rgba(255,255,255,0.06);
    }
  }
}

.content-box {
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  padding: 24px;
  background: #1a1a1a;

  .page-title-tabs {
    display: flex;
    align-items: center;
    gap: 12px;
    background: transparent;
    margin-bottom: 24px;

    .tab-item {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 38px;
      padding: 0 18px;
      font-size: 14px;
      font-weight: 800;
      color: #f5f5f5;
      border: 1px solid #404040;
      border-radius: 25px;
      background: #1a1a1a;
      cursor: pointer;
      transition: all 0.15s;

      &.active {
        color: #fff;
        border: 1px solid #ff9aca;
        background: linear-gradient(145deg, #ff65ab, #f02c80);
        border: 2px solid #ff9aca;
        box-shadow: 0 0 23px rgba(255, 50, 140, .65);
      }

      &:hover:not(.active) {
        border-color: #888;
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
        border: 1px solid #3d3d3d;
      }

      .meta {
        .nickname {
          font-size: 16px;
          font-weight: 800;
          color: #f5f5f5;
          margin-bottom: 4px;
        }

        .id {
          font-size: 14px;
          color: #f5f5f5;
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
      border: 1px solid #3d3d3d;

      span {
        font-size: 18px;
      }
    }
  }

  .plan-desc {
    font-size: 14px;
    color: #ccc;
    line-height: 20px;
    margin-bottom: 12px;
  }

  .desc {
    font-size: 14px;
    color: #aaa;
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
      color: #f5f5f5;

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
        color: #ff4f9a;
        font-weight: 800;
        margin-left: 4px;
      }
    }
  }

  .pay-btn {
    width: 100%;
    height: 48px;
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    border: 2px solid #ff9aca;
    border-radius: 14px;
    box-shadow: 0 0 16px rgba(255, 61, 134, .3);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    transition: box-shadow 0.15s, filter 0.15s;

    &:hover {
      box-shadow: 0 0 22px rgba(255, 61, 134, .35);
      filter: brightness(1.06);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
      filter: none;
    }
  }

  .auto-renewal-note {
    margin-top: 12px;
    font-size: 12px;
    color: #777;
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
