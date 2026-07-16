<template>
  <div class="account-required-modal-mask" v-if="visible">
    <div class="account-required-modal">
      <img
        class="modal-close"
        src="@/assets/images/base/close.png"
        alt="close"
        @click="handleClose"
      />
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.account-required-modal {
  width: 480px;
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  position: relative;

  .modal-close {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-content {
    text-align: center;
    padding: 20px 0;
  }

  .modal-message {
    font-size: 16px;
    color: #364153;
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
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #fb64b6;
      }
    }

    .btn-create {
      background: #fb64b6;
      color: #ffffff;

      &:hover {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }
      }
    }
  }
}
</style>
