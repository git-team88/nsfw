<template>
  <!-- 漫剧解锁全集。价格取不到就整张卡不渲染 —— 宁可不显示，也不给一个没有金额的付费入口 -->
  <div class="drama-unlock-card" v-if="priceText">
    <!-- 价格要单独上色，所以整句走 v-html；插进去的只有自己算出来的金额文案 -->
    <p class="unlock-tip" v-html="unlockTipHtml"></p>

    <div class="pay-methods">
      <!-- 现金支付先不看博主的 Stripe 开通状态（blogger_status）：始终可选并默认选中。
           canPayCash 现在恒为 true，恢复时把它改回按 blogger_status 判断即可 -->
      <label v-if="canPayCash" class="pay-method" :class="{ active: payMethod === 'cash' }" @click="payMethod = 'cash'">
        <span class="radio"></span>
        <span class="label">{{ t('subscribe.cashPay') }}</span>
      </label>
      <label class="pay-method" :class="{ active: payMethod === 'usdt' }" @click="payMethod = 'usdt'">
        <span class="radio"></span>
        <span class="label">{{ t('subscribe.usdtPay') }}</span>
      </label>
    </div>

    <!-- 加载态只靠整页遮罩表现，按钮文案和样式不跟着变 -->
    <button class="unlock-btn" @click="handleUnlock">
      {{ t('collection.unlockFullSeries') }}
    </button>

    <p class="pay-terms">
      {{ t('collection.payAgree') }}<span class="terms-link">{{ t('subscribe.paymentTerms') }}</span>
    </p>

    <!--
      挂到 body 上：卡片外层 .drama-unlock-wrap 有 transform，
      transform 会变成 position:fixed 的包含块，不 teleport 的话遮罩只盖住卡片那一小块。
    -->
    <Teleport to="body">
      <WalletSelectModal
        :visible="showWalletModal"
        @close="showWalletModal = false"
        @select="handleWalletSelect"
        @noWallet="handleNoWallet"
      />

      <!-- 下单 / 跳 Stripe / 链上转账期间都盖住，不给取消 —— 中途取消会留下孤儿订单 -->
      <UploadMask :visible="isLoading" :text="t('loading')" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import WalletSelectModal from '@/components/WalletSelectModal.vue';
import UploadMask from '@/components/UploadMask.vue';
import api from '@/api/index';
import { getGaClientId } from '@/utils/analytics';
import { toast } from '@/util/toast';
import erc20Abi from '@/util/abi/erc20Abi.json';
import { USDT_CONTRACT_ADDRESS, SUBSCRIPTION_RECEIVER_ADDRESS } from '@/util/config';
import { connectWalletConnect, getWalletConnectProvider } from '@/util/walletconnect';
import { getWalletProvider, ensureChain, checkUsdtBalance } from '@/util/wallet';
import { fiatPrefix, fiatSuffix, scaleFiatPrice, trimTrailingZeros } from '@/util/currency';

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
  /** 收费档位 id，详情接口的 plan 里带下来 */
  planId?: string | number;
  /** 博主的 blogger_status，1 = 已开通 Stripe 收款，才能用现金支付 */
  bloggerStatus?: number | string;
}>();

const emit = defineEmits<{ (e: 'unlocked'): void }>();

const { t, locale } = useI18n();
const router = useRouter();

// 现金支付先不看博主的 Stripe 开通状态：这里恒为 true，
// 恢复时改回 Number(props.bloggerStatus) == 1，并把 payMethod 初值改回 canPayCash.value ? 'cash' : 'usdt'
const canPayCash = computed(() => true);
// 现金始终可选，默认就选现金；下面的 watch 在 canPayCash 恒为 true 时不会触发
const payMethod = ref<'cash' | 'usdt'>('cash');
watch(canPayCash, (ok) => {
  payMethod.value = ok ? 'cash' : 'usdt';
});

// plan_id 由详情接口的 plan 直接下发，这里不再单独去拉档位列表
function resolvePlanId(): string {
  const id = props.planId;
  return id === undefined || id === null ? '' : String(id);
}
const showWalletModal = ref(false);
const isLoading = ref(false);

// 金额一律是美分，currency 缺省时也按 usd 缩放，否则 1200 会显示成 $1200
const payCurrency = computed(() => props.currency || 'usd');

/** 把金额包一层 span 好上色，其余部分还是多语言原文 */
const unlockTipHtml = computed(() =>
  t('collection.unlockTip', { price: `<span class="tip-price">${priceText.value}</span>` }),
);

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

async function handleUnlock() {
  if (isLoading.value) return;
  if (!checkLogin()) return;

  if (payMethod.value === 'usdt') {
    showWalletModal.value = true;
    return;
  }

  // 现金走 Stripe：book/addBookOrder 下单拿 checkout 地址，再整页跳过去
  isLoading.value = true;

  try {
    const planId = resolvePlanId();
    if (!props.bookId || !planId) {
      toast(t('fail'));
      return;
    }

    const res = (await api.addBookOrder({
      book_id: props.bookId,
      plan_id: planId,
      // 后端靠这个把成功/失败页的回跳地址拼上 post_id，「观看作品」才知道回哪一集
      post_id: props.postId,
      client_id: await getGaClientId(),
    })) as any;

    if (res.code === 0 || res.code === 200) {
      // 地址包了一层：data.url.url，兼容后端以后拍平成 data.url
      const checkoutUrl = typeof res.data?.url === 'string' ? res.data.url : res.data?.url?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      toast(t('fail'));
    } else {
      toast(apiMsg(res));
    }
  } catch {
    toast(t('fail'));
  } finally {
    // 跳 Stripe 这条也一样撤掉 —— 留着的话从 Stripe 返回时页面是 bfcache 恢复的，
    // 组件不重建，遮罩会一直盖在那儿
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

    // 漫剧解锁按合集下单，不走博主订阅那条
    const res = (await api.generateUBookOrder({
      book_id: props.bookId,
      wallet: account,
      client_id: await getGaClientId(),
    })) as any;

    if (res.code == 0 || res.code == 200) {
      const orderId = res.data?.order_id || '';
      const txHash = await transferUSDT(walletProvider, account, amount);
      if (txHash && orderId) {
        await api.webThreeCallbackUBookPaid({ order_id: orderId, tx_hash: txHash }).catch(() => {});
        emit('unlocked');
        goResult('success', amount, orderId);
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

/**
 * 跳解锁的支付结果页。USDT 是前端自己跳，所以 post_id / book_id 在这里拼；
 * 现金那条是 Stripe 回跳，由后端往 success_url 上拼。
 * 空值不往 query 里塞 —— post_id= 这种空串会让成功页误判成「有 post_id」。
 * 成功时带上 USDT 金额和币种，成功页靠它们上报 purchase。
 */
function goResult(kind: 'success' | 'fail', usdtAmount?: string, orderId?: string) {
  const query: Record<string, string> = {};
  if (props.postId !== undefined && props.postId !== null && props.postId !== '') {
    query.post_id = String(props.postId);
  }
  if (kind === 'success' && usdtAmount && parseFloat(usdtAmount) > 0) {
    query.amount = trimTrailingZeros(usdtAmount); // 去掉末尾多余的 0
    query.currency = 'USDT';
    if (orderId) query.order_id = orderId; // 成功页用它防重复上报
  }
  router.push({
    path: kind === 'success' ? '/drama-unlock-success' : '/drama-unlock-fail',
    query,
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

  /* v-html 插进来的，得用 :deep 才命中 */
  :deep(.tip-price) {
    color: #FF4D8E;
  }
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
  cursor: default;
}

.terms-link {
  /* 只是协议名，不跳转，样式照旧，只是不可点 */
  color: #FF4D8E;
  text-decoration: underline;
}
</style>
