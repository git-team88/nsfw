<template>
  <div class="account-required-modal-mask" v-if="visible">
    <div class="account-required-modal">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
      <div class="modal-content">
        <p class="modal-message">{{ t('user.subscription.accountFailedMessage') }}</p>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" @click="handleClose">
          {{ t('user.interactive.cancel') }}
        </button>
        <button class="btn-create" @click="handleModify">
          {{ t('user.subscription.goModify') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AccountFailedModal">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'modify'): void;
}>();

function handleClose() {
  emit('close');
}

function handleModify() {
  emit('modify');
}
</script>

<style scoped lang="scss">
.account-required-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.account-required-modal {
  width: 480px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 18px;
  padding: 32px;
  position: relative;

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

  .modal-content {
    text-align: center;
    padding: 20px 0;
  }

  .modal-message {
    font-size: 16px;
    color: #f5f5f5;
    margin: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 32px;

    button {
      min-width: 136px;
      height: 48px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-cancel {
      background: rgba(255,255,255,0.06);
      color: #aaa;

      &:hover {
        color: #ff4f9a;
      }
    }

    .btn-create {
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #ffffff;

      &:hover:not(:disabled) {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }
      &:active {
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      }
    }
  }
}
</style>
