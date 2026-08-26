<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal token-withdraw-modal">
      <button class="modal-close" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="modal-amount-row">
        <span class="amount-label">{{ t("user.revenue.withdrawAmount") }}</span>
        <span class="amount-value">{{ formatSci(props.amount) }}</span>
        <span class="amount-unit">USDT</span>
      </div>
      <div class="amount-note">{{ t("user.revenue.feeNote", { fee: reserveFee, actual: actualAmount }) }}</div>

      <div class="wallet-header">
        <span class="wallet-label">{{ t("user.revenue.selectWallet") }}</span>
      </div>

      <div class="wallet-list">
        <div
          class="wallet-item"
          v-for="wallet in wallets"
          :key="wallet.id"
          :class="{ active: selectedWallet === wallet.id }"
          @click="selectWallet(wallet)"
        >
          <img class="wallet-icon" :src="wallet.icon" :alt="wallet.name" />
          <span class="wallet-name">{{ isInstalled(wallet.id) ? wallet.name : `${wallet.name}` }}</span>
        </div>
      </div>

      <button class="confirm-btn" :disabled="!agreeTerms || !selectedWallet || submitting" @click="handleConfirm">
        {{ submitting ? t('loading') : t("user.revenue.confirmApply") }}
      </button>

      <div class="agree-row" @click="agreeTerms = !agreeTerms">
        <img v-if="agreeTerms" class="check-icon" src="@/assets/images/register/check_active.png" alt="" />
        <img v-else class="check-icon" src="@/assets/images/register/check.png" alt="" />
        <span class="agree-text">
          {{ t("user.revenue.agreePrefix") }}
          <a href="#" class="terms-link">{{ t("user.revenue.terms") }}</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="TokenWithdrawModal">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import api from "@/api/index";
import { connectWalletConnect, getWalletConnectProvider } from "@/util/walletconnect";
import { getWalletProvider, ensureChain } from "@/util/wallet";
import okxIcon from '@/assets/images/wallet/okx.png';
import metamaskIcon from '@/assets/images/wallet/metamask.png';
import phantomIcon from '@/assets/images/wallet/phantom.png';
import walletconnectIcon from '@/assets/images/wallet/walletconnect.png';

const { t, locale } = useI18n();
const router = useRouter();

const props = defineProps<{
  visible: boolean;
  amount: number | string | null;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();

const agreeTerms = ref(true);
const selectedWallet = ref('');
const submitting = ref(false);
const hasOkx = ref(false);
const hasPhantom = ref(false);

const reserveFee = computed(() => {
  const amt = Number(props.amount);
  if (!amt || amt <= 0) return '1.00';
  const fee = amt * 0.01;
  const rounded = Math.round(fee * 100) / 100;
  return rounded < 1 ? '1.00' : rounded.toFixed(2);
});

const actualAmount = computed(() => {
  const amt = Number(props.amount);
  if (!amt || amt <= 0) return '0.00';
  const actual = amt - Number(reserveFee.value);
  return actual.toFixed(2);
});

const wallets = [
  { id: 'metamask', name: 'MetaMask', icon: metamaskIcon, installUrl: '' },
  { id: 'okx', name: 'OKX Web3', icon: okxIcon, installUrl: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge' },
  { id: 'phantom', name: 'Phantom', icon: phantomIcon, installUrl: 'https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa?hl=zh-CN&utm_source=ext_sidebar' },
  { id: 'walletconnect', name: 'WalletConnect', icon: walletconnectIcon, installUrl: '' },
];

onMounted(() => {
  hasOkx.value = typeof (window as any).okxwallet !== 'undefined';
  hasPhantom.value = typeof (window as any).phantom !== 'undefined';
});

watch(() => props.visible, (val) => {
  if (!val) {
    selectedWallet.value = '';
    agreeTerms.value = true;
    submitting.value = false;
  }
});

function isInstalled(walletId: string): boolean {
  if (walletId === 'okx') return hasOkx.value;
  if (walletId === 'phantom') return hasPhantom.value;
  return true;
}

function selectWallet(wallet: { id: string; name: string; installUrl: string }) {
  if (!isInstalled(wallet.id) && wallet.installUrl) {
    window.open(wallet.installUrl, '_blank');
    return;
  }
  selectedWallet.value = wallet.id;
}

async function handleConfirm() {
  if (!agreeTerms.value || !selectedWallet.value || !props.amount || submitting.value) return;
  submitting.value = true;
  try {
    let walletProvider: any;
    let account: string;

    if (selectedWallet.value === 'walletconnect') {
      try {
        const accounts = await connectWalletConnect();
        if (!accounts || accounts.length === 0) {
          submitting.value = false;
          return;
        }
        walletProvider = getWalletConnectProvider();
        account = accounts[0];
      } catch (error) {
        submitting.value = false;
        return;
      }
    } else {
      walletProvider = getWalletProvider(selectedWallet.value);
      if (!walletProvider) {
        toast(t("fail"));
        submitting.value = false;
        return;
      }
      const chainOk = await ensureChain(walletProvider);
      if (!chainOk) {
        submitting.value = false;
        return;
      }
      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        toast(t("fail"));
        submitting.value = false;
        return;
      }
      account = accounts[0];
    }

    const res = await api.applyWithdraw({
      to_wallet: account,
      amount: props.amount,
    });
    const data = res as any;
    if (data.code === 200 || data.code === 0) {
      emit('close');
      router.replace('/token-withdraw-success');
    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
    }
  } catch (error) {
    toast(t("fail"));
  } finally {
    submitting.value = false;
  }
}

function openTerms() {
  localStorage.setItem("isBack", "1");
  window.open("/payment-terms", "_blank");
}

function formatSci(n: number | string | null) {
  if (n == null) return "0";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 560px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  position: relative;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}
.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-amount-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}
.amount-label {
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f5;
}
.amount-value {
  font-size: 28px;
  font-weight: 700;
  color: #ff4f9a;
  letter-spacing: -0.5px;
}
.amount-unit {
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f5;
}
.amount-note {
  font-size: 12px;
  color: #777;
  margin-bottom: 20px;
}

.wallet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.wallet-label {
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f5;
}

.wallet-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
.wallet-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(50% - 5px);
  padding: 12px 14px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  cursor: pointer;
  transition: border-color 0.14s;

  &:hover {
    border-color: #3d3d3d;
  }
  &.active {
    border-color: #ff4f9a;
    border-width: 1px;
  }
}
.wallet-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
}
.wallet-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f5;
}

.agree-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  cursor: pointer;
}
.check-icon {
  width: 20px;
  height: 20px;
}
.agree-text {
  font-size: 13px;
  color: #777;
}
.terms-link {
  color: #ff4f9a;
  text-decoration: none;
  pointer-events: none;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  padding: 0 24px;
  margin: 0 auto;
  border: 1px solid #ff9aca;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  transition: transform 0.1s, box-shadow 0.1s;

  &:hover:not(:disabled) {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }
  &:active:not(:disabled) {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .modal {
    padding: 16px;
  }
  .wallet-item {
    width: 100%;
    padding: 10px 12px;
  }
  .wallet-icon {
    width: 24px;
    height: 24px;
  }
  .amount-value {
    font-size: 22px;
  }
}
</style>
