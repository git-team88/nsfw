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
  width: 48rem;
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 3.2rem;
  position: relative;

  .modal-close {
    position: absolute;
    right: 2rem;
    top: 2rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-content {
    text-align: center;
    padding: 2rem 0;
  }

  .modal-message {
    font-size: 1.6rem;
    color: #364153;
    margin: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 2.4rem;
    margin-top: 3.2rem;

    button {
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      border-radius: 0.8rem;
      font-size: 1.4rem;
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
          border-radius: 0.8rem;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }
      }
    }
  }
}
</style>
