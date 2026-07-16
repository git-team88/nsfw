<template>
  <div class="logout-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleClose" />

      <div class="modal-message">{{ t('header.logoutConfirm') }}</div>
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="btn btn-confirm" @click="handleConfirm">{{ t('home.styleSelect.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="LogoutModal">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'confirm']);

function handleClose() {
  emit('close');
}

function handleCancel() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style lang="scss">
.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background-color: #ffffff;
    border-radius: 12px;
    padding: 54px 24px 24px;

    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-message {
      font-size: 14px;
      color: #364153;
      margin-bottom: 34px;
      text-align: center;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 24px;

      button {
        min-width: 136px;
        height: 48px;
        border: none;
        -webkit-border-radius: 8px;
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
      .btn-confirm {
        border: none;
        background: #fb64b6;
        color: #ffffff;

        &:hover {
          position: relative;
          &::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            z-index: 1;
          }
        }
      }
    }
  }
}
</style>