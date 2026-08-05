<template>
  <Teleport to="body">
    <div class="logout-modal" v-if="visible">
      <div class="modal-overlay" @click="handleClose"></div>
      <div class="modal-content">
        <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

        <div class="modal-message">{{ t('header.logoutConfirm') }}</div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
          <button class="btn btn-confirm" @click="handleConfirm">{{ t('home.styleSelect.confirm') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
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
    border: 2px solid #161122;
    border-radius: 14px;
    padding: 54px 24px 24px;

    .close-btn {
      background: #fff;
      border: 2.5px solid #161122;
      border-radius: 50%;
      padding: 0;
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 3px 3px 0 #161122;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &:hover { transform: scale(1.1) rotate(90deg); }
    }

    .modal-message {
      font-size: 14px;
      font-weight: 800;
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
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
      }

      .btn-cancel {
        background: #fff;
        color: #161122;

        &:hover {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
        }
      }
      .btn-confirm {
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
