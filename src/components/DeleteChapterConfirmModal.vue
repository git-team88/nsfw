<template>
  <div class="delete-chapter-confirm-modal">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-btn" @click="handleCancel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3 class="modal-title">{{ t('collectionDetail.deleteChapterConfirm.title') }}</h3>
      </div>

      <div class="modal-body">
        <p class="confirm-text">{{ t('collectionDetail.deleteChapterConfirm.description') }}</p>
        <p class="note-text">{{ t('collectionDetail.deleteChapterConfirm.note') }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleCancel">{{ t('collectionDetail.deleteChapterConfirm.cancel') }}</button>
        <button class="btn btn-danger" @click="handleConfirm">{{ t('collectionDetail.deleteChapterConfirm.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

function handleCancel() {
  emit('close');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style lang="scss" scoped>
.delete-chapter-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
    padding: 18px 24px;
    text-align: center;

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

    .modal-header {
      margin-bottom: 24px;

      .modal-title {
        font-size: 18px;
        font-weight: bold;
        color: #f5f5f5;
        margin: 0;
      }
    }

    .modal-body {
      margin-bottom: 24px;
      text-align: left;

      .confirm-text {
        font-size: 14px;
        color: #f5f5f5;
        line-height: 20px;
        margin-bottom: 10px;
      }

      .note-text {
        font-size: 14px;
        color: #aaa;
        line-height: 20px;
      }
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
      }

      .btn-cancel {
        background: #1a1a1a;
        color: #f5f5f5;

        &:hover {
          color: #ff4f9a;
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }

      .btn-danger {
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #f5f5f5;

        &:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }
    }
  }
}
</style>
