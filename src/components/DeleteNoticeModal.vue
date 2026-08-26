<template>
  <div v-if="visible" class="delete-notice-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <h3 class="modal-title">{{ t('collectionSettings.deleteNotice.title') }}</h3>

      <div class="modal-message" v-html="t('collectionSettings.deleteNotice.description')"></div>

      <div class="modal-notice">
        <p class="notice-label">{{ t('collectionSettings.deleteNotice.note') }}</p>
      </div>

      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('close')">{{ t('collectionSettings.deleteNotice.cancel') }}</button>
        <button class="modal-confirm-btn" @click="$emit('next')">{{ t('collectionSettings.deleteNotice.next') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DeleteNoticeModal">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  visible: boolean;
}>();

defineEmits(['close', 'next']);

function handleOverlayClick() {
  // Don't close on overlay click for important actions
}
</script>

<style lang="scss" scoped>
.delete-notice-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

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
     padding: 18px 30px 24px;

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
       box-shadow: none;
       transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
       z-index: 10;

       &:hover { transform: scale(1.1) rotate(90deg); }
     }

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #f5f5f5;
      margin-bottom: 24px;
      text-align: center;
    }

    .modal-message {
      font-size: 14px;
      color: #f5f5f5;
      margin-bottom: 10px;
      line-height: 20px;
    }

    .modal-notice {
      margin-bottom: 24px;

      .notice-label {
        font-size: 14px;
        color: #aaa;
        margin: 0;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

       .modal-cancel-btn {
         min-width: 136px;
         height: 48px;
         border: 1px solid #3d3d3d;
         border-radius: 8px;
         font-size: 14px;
         cursor: pointer;
         background: #1a1a1a;
         color: #aaa;
         box-shadow: 0 15px 35px rgba(0,0,0,0.5);

         &:hover {
           color: #ff4f9a;
           border-color: #ff4f9a;
         }
       }

        .modal-confirm-btn {
          min-width: 136px;
          height: 48px;
          border: 1px solid #ff9aca;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
          color: #ffffff;
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);

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
