<template>
  <div class="wallet-modal-mask" v-if="visible" @click.self="handleClose">
    <div class="wallet-modal">
      <button class="modal-close" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
      <div class="modal-header">
        <div class="modal-title">{{ t('subscribe.selectWallet') }}</div>
      </div>
      <div class="wallet-list">
        <div
          class="wallet-item"
          v-for="wallet in wallets"
          :key="wallet.id"
          @click="handleWalletClick(wallet)"
        >
          <img class="wallet-icon" :src="wallet.icon" :alt="wallet.name" />
          <span class="wallet-name">{{ isInstalled(wallet.id) ? wallet.name : `Install ${wallet.name}` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="WalletSelectModal">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import okxIcon from '@/assets/images/wallet/okx.png';
import metamaskIcon from '@/assets/images/wallet/metamask.png';
import phantomIcon from '@/assets/images/wallet/phantom.png';
import walletconnectIcon from '@/assets/images/wallet/walletconnect.png';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', wallet: { id: string; name: string }): void;
  (e: 'noWallet'): void;
}>();

const wallets = [
  { id: 'metamask', name: 'MetaMask', icon: metamaskIcon, installUrl: '' },
  { id: 'okx', name: 'OKX Web3', icon: okxIcon, installUrl: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge' },
  { id: 'phantom', name: 'Phantom', icon: phantomIcon, installUrl: 'https://chromewebstore.google.com/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa?hl=zh-CN&utm_source=ext_sidebar' },
  { id: 'walletconnect', name: 'WalletConnect', icon: walletconnectIcon, installUrl: '' },
];

const hasOkx = ref(false);
const hasPhantom = ref(false);

onMounted(() => {
  hasOkx.value = typeof (window as any).okxwallet !== 'undefined';
  hasPhantom.value = typeof (window as any).phantom !== 'undefined';
});

function isInstalled(walletId: string): boolean {
  if (walletId === 'walletconnect') return true;
  if (walletId === 'okx') return hasOkx.value;
  if (walletId === 'phantom') return hasPhantom.value;
  return true;
}

function handleWalletClick(wallet: { id: string; name: string; installUrl: string }) {
  if (!isInstalled(wallet.id) && wallet.installUrl) {
    window.open(wallet.installUrl, '_blank');
    return;
  }
  emit('select', wallet);
}

function handleClose() {
  emit('close');
}

function handleNoWallet() {
  emit('noWallet');
}
</script>

<style scoped lang="scss">
.wallet-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wallet-modal {
  position: relative;
  width: 700px;
  max-width: 90vw;
  background: #FFFDF7;
  border: 2.5px solid #161122;
  border-radius: 13px;
  box-shadow: 3px 3px 0 #161122;
  padding: 24px;
}

.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;
  z-index: 10;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 800;
  color: #161122;
}

.wallet-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: calc(50% - 6px);
  padding: 16px;
  background: #FFFDF7;
  border: 2.5px solid rgba(22, 17, 34, 0.2);
  border-radius: 13px;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.14s;

  &:hover {
    transform: translate(-1px, -1px);
    border-color: #161122;
  }

  &:active {
    transform: translate(1px, 1px);
  }
}

.wallet-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.wallet-name {
  font-size: 16px;
  font-weight: 800;
  color: #161122;
}

.wallet-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #FF4D8D;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
}

@media (max-width: 480px) {
  .wallet-modal {
    padding: 16px;
  }
  .wallet-item {
    padding: 12px 14px;
  }
  .wallet-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
