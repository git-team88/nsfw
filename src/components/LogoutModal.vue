<template>
  <Teleport to="body">
    <div class="logout-modal" v-if="visible">
      <div class="modal-overlay" @click="handleClose"></div>
      <div class="modal-content">
        <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background-color: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    border-radius: 18px;
    padding: 56px 30px 28px;

    .close-btn {
      background: #1a1a1a;
      border: 1px solid #3d3d3d;
      border-radius: 999px;
      padding: 6px;
      position: absolute;
      top: 12px;
      right: 18px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10;

      &:hover { transform: scale(1.1) rotate(90deg); }
    }

    .modal-message {
      font-size: 14px;
      color: #f5f5f5;
      margin-bottom: 24px;
      text-align: center;
      line-height: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: center;
      gap: 24px;

      button {
        min-width: 136px;
        height: 48px;
        border: 1px solid #3d3d3d;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s;
      }

      .btn-cancel {
        background: #1a1a1a;
        color: #f5f5f5;

        &:hover {
          color: #ff4f9a;
          background: rgba(255,255,255,0.06);
        }
        &:active {
          transform: translate(0, 0);
        }
      }
      .btn-confirm {
        background: linear-gradient(145deg, #ff74b3, #f73382);
        color: #f5f5f5;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        &:active {
          transform: translate(0, 0);
        }
      }
    }
  }
}
</style>
