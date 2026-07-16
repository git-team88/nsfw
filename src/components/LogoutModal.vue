<template>
  <div class="logout-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
    background-color: rgba(22, 17, 34, 0.4);
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
      background: none;
      border: none;
      padding: 0;
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
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
      .btn-confirm {
        border: none;
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
}
</style>
