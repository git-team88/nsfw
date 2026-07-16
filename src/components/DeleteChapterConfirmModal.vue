<template>
  <div class="delete-chapter-confirm-modal">
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <button class="close-btn" @click="handleCancel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
    padding: 18px 24px;
    text-align: center;

    .close-btn {
      background: none;
      border: none;
      padding: 0;
      position: absolute;
      top: 20px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-header {
      margin-bottom: 24px;

      .modal-title {
        font-size: 18px;
        font-weight: bold;
        color: #161122;
        margin: 0;
      }
    }

    .modal-body {
      margin-bottom: 24px;
      text-align: left;

      .confirm-text {
        font-size: 14px;
        color: #161122;
        line-height: 20px;
        margin-bottom: 10px;
      }

      .note-text {
        font-size: 14px;
        color: #5b5566;
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

      .btn-danger {
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
