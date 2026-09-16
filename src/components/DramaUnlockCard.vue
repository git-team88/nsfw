<template>
  <!-- 漫剧解锁全集。价格取不到就整张卡不渲染 —— 宁可不显示，也不给一个没有金额的付费入口 -->
  <div class="drama-unlock-card" v-if="priceText">
    <p class="unlock-tip">{{ t('collection.unlockTip', { price: priceText }) }}</p>

    <div class="pay-methods">
      <label class="pay-method" :class="{ active: payMethod === 'cash' }" @click="payMethod = 'cash'">
        <span class="radio"></span>
        <span class="label">{{ t('subscribe.cashPay') }}</span>
      </label>
      <label class="pay-method" :class="{ active: payMethod === 'usdt' }" @click="payMethod = 'usdt'">
        <span class="radio"></span>
        <span class="label">{{ t('subscribe.usdtPay') }}</span>
      </label>
    </div>

    <button class="unlock-btn" :disabled="isLoading" @click="handleUnlock">
      {{ isLoading ? t('loading') : t('collection.unlockFullSeries') }}
    </button>

    <p class="pay-terms">
      {{ t('collection.payAgree') }}<a class="terms-link" @click="goTerms">{{ t('subscribe.paymentTerms') }}</a>
    </p>

    <WalletSelectModal
      :visible="showWalletModal"
      @close="showWalletModal = false"
      @select="handleWalletSelect"
      @noWallet="handleNoWallet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import WalletSelectModal from '@/components/WalletSelectModal.vue';
import api from '@/api/index';
import { toast } from '@/util/toast';
import erc20Abi from '@/util/abi/erc20Abi.json';
import { USDT_CONTRACT_ADDRESS, SUBSCRIPTION_RECEIVER_ADDRESS } from '@/util/config';
import { connectWalletConnect, getWalletConnectProvider } from '@/util/walletconnect';
import { getWalletProvider, ensureChain, checkUsdtBalance } from '@/util/wallet';
import { fiatPrefix, fiatSuffix, scaleFiatPrice } from '@/util/currency';

const props = defineProps<{
  /** 合集 id */
  bookId?: string | number;
  /** 当前这一集的 post id */
  postId?: string | number;
  /** 作者 id —— 现在的下单接口按作者维度走 */
  authorId?: string | number;
  /** 法币价格，原始金额（usd 下是美分） */
  price?: string | number;
  currency?: string;
  /** USDT 价格。没单独下发就退回法币换算后的数值 */
  web3Price?: string | number;
}>();

const emit = defineEmits<{ (e: 'unlocked'): void }>();

const { t, locale } = useI18n();
const router = useRouter();

// 默认选中 USDT，和设计稿一致
const payMethod = ref<'cash' | 'usdt'>('usdt');
const showWalletModal = ref(false);
const isLoading = ref(false);

// 金额一律是美分，currency 缺省时也按 usd 缩放，否则 1200 会显示成 $1200
const payCurrency = computed(() => props.currency || 'usd');

const priceText = computed(() => {
  const raw = props.price;
  if (raw === undefined || raw === null || raw === '') return '';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${fiatPrefix(payCurrency.value)}${scaleFiatPrice(raw, payCurrency.value)}${fiatSuffix(payCurrency.value, t('aiRecharge.unit'))}`;
});

/** USDT 金额。接口没单独给 web3 价就用法币换算后的数值顶上 */
const usdtAmount = computed(() => {
  const w = props.web3Price;
  if (w !== undefined && w !== null && w !== '' && Number(w) > 0) return String(w);
  return scaleFiatPrice(props.price, payCurrency.value);
});

function apiMsg(data: any): string {
  return locale.value == 'en' ? data.msg
    : locale.value == 'zh' ? data.msg_cn
    : locale.value == 'tc' ? data.msg_tc
    : data.msg_jp;
}

function checkLogin(): boolean {
  if (localStorage.getItem('token')) return true;
  router.push('/login');
  return false;
}

function goTerms() {
  router.push('/payment-terms');
}

async function handleUnlock() {
  if (!checkLogin()) return;

  if (payMethod.value === 'usdt') {
    showWalletModal.value = true;
    return;
  }

  // 现金走 Stripe。下单接口暂时照搬订阅博主那套，只多带作品参数，
  // 等解锁专用接口出来把这里换掉即可。
  try {
    isLoading.value = true;
    const res = (await api.subscribe({
      creator_id: props.authorId,
      book_id: props.bookId,
      post_id: props.postId,
    })) as any;
    if (res.code === 0 || res.code === 200) {
      window.location.href = res.data?.url;
    } else {
      toast(apiMsg(res));
    }
  } catch {
    toast(t('fail'));
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
      const accounts = await connectWalletConnect();
      if (!accounts || accounts.length === 0) return;
      walletProvider = getWalletConnectProvider();
      account = accounts[0];
    } else {
      isLoading.value = true;
      walletProvider = getWalletProvider(wallet.id);
      if (!walletProvider) {
        toast(t('fail'));
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
        toast(t('fail'));
        isLoading.value = false;
        return;
      }
      account = accounts[0];
    }

    isLoading.value = true;

    const amount = usdtAmount.value;
    if (!amount || parseFloat(amount) <= 0) {
      toast(t('fail'));
      isLoading.value = false;
      return;
    }

    const balanceOk = await checkUsdtBalance(walletProvider, account, amount);
    if (!balanceOk) {
      isLoading.value = false;
      return;
    }

    const res = (await api.generateUBloggerSubOrder({
      blogger_id: props.authorId,
      book_id: props.bookId,
      post_id: props.postId,
      address: account,
    })) as any;

    if (res.code == 0 || res.code == 200) {
      const orderId = res.data?.order_id || '';
      const txHash = await transferUSDT(walletProvider, account, amount);
      if (txHash && orderId) {
        await api.webThreeCallbackUPaid({ order_id: orderId, tx_hash: txHash }).catch(() => {});
        emit('unlocked');
        goResult('success');
      } else {
        goResult('fail');
      }
    } else {
      toast(apiMsg(res));
      goResult('fail');
    }
  } catch {
    toast(t('fail'));
    goResult('fail');
  } finally {
    isLoading.value = false;
  }
}

/** 跳解锁的支付结果页，带上 post_id 供「观看作品」用 */
function goResult(kind: 'success' | 'fail') {
  router.push({
    path: kind === 'success' ? '/drama-unlock-success' : '/drama-unlock-fail',
    query: { post_id: String(props.postId ?? ''), book_id: String(props.bookId ?? '') },
  });
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
    }
    toast(t('fail'));
    return null;
  } catch (error: any) {
    const errMsg = error?.data?.message || error?.message || '';
    if (errMsg.toLowerCase().includes('insufficient')) {
      toast(t('subscribe.insufficientUsdtOrGas'));
    } else if (errMsg) {
      toast(errMsg);
    } else {
      toast(t('fail'));
    }
    return null;
  }
}

function handleNoWallet() {
  window.open('https://ethereum.org/en/wallets/', '_blank');
}
</script>

<style lang="scss" scoped>
.drama-unlock-card {
  width: min(420px, 100%);
  margin: 16px auto;
  padding: 24px 28px 20px;
  background: #FFFFFF;
  border: 2px solid #FF4D8E;
  border-radius: 16px;
  box-shadow: 0px 4px 20px rgba(255, 77, 142, 0.14);
  text-align: center;
}

.unlock-tip {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  color: #161122;
}

.pay-methods {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;
}

.pay-method {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #161122;
  cursor: pointer;
  user-select: none;

  .radio {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #161122;
    position: relative;
  }

  &.active .radio {
    border-color: #FF4D8E;
  }

  &.active .radio::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: #FF4D8E;
  }
}

.unlock-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #FF4D8E;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.pay-terms {
  margin: 12px 0 0;
  font-size: 12px;
  color: #8A8A99;
}

.terms-link {
  color: #FF4D8E;
  cursor: pointer;
  text-decoration: underline;
}
</style>
