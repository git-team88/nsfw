<template>
  <div class="account-required-modal-mask" v-if="visible">
    <div class="account-required-modal">
      <button class="modal-close" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
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
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.account-required-modal {
  width: 480px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  padding: 32px;
  position: relative;

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

    &:hover { transform: scale(1.1) rotate(90deg); }
  }

  .modal-content {
    text-align: center;
    padding: 20px 0;
  }

  .modal-message {
    font-size: 16px;
    color: #161122;
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
      background: rgba(22, 17, 34, 0.06);
      color: #5b5566;

      &:hover {
        color: #FF4D8D;
      }
    }

    .btn-create {
      background: #FF4D8D;
      color: #ffffff;

      &:hover:not(:disabled) {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }
      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
      }
    }
  }
}
</style>
