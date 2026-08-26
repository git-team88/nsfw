<template>
  <div class="delete-record-modal" v-if="visible">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-title">{{ t('recordList.deleteConfirm') }}</div>
      <div class="modal-tip">{{ t('recordList.deleteWarning') }}</div>
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="btn btn-confirm" @click="handleConfirm">{{ t('recordList.delete') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DeleteRecordModal">
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

function handleConfirm() {
  emit('confirm');
}
</script>

<style lang="scss">
.delete-record-modal {
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
    border-radius: 18px;
    padding: 32px 24px 24px;

    .close-btn {
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

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 16px;
      text-align: center;
    }

    .modal-tip {
      font-size: 14px;
      color: #777;
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
        border: 1px solid #3d3d3d;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        box-shadow: none;

        &:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }

      .btn-cancel {
        background: #1a1a1a;
        color: #f5f5f5;

        &:hover:not(:disabled) {
          color: #ff4f9a;
        }
      }
      .btn-confirm {
        border: 1px solid #ff9aca;
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #f5f5f5;
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      }
    }
  }
}
</style>
