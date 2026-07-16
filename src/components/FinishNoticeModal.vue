<template>
  <div v-if="visible" class="finish-notice-modal">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />

      <h3 class="modal-title">{{ t('collectionSettings.finishNotice.title') }}</h3>

      <div class="modal-message" v-html="t('collectionSettings.finishNotice.description')"></div>

      <div class="modal-notice">
        <p class="notice-label">{{ t('collectionSettings.finishNotice.note') }}</p>

        <div class="notice-content" v-html="t('collectionSettings.finishNotice.item')">
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('close')">{{ t('collectionSettings.finishNotice.cancel') }}</button>
        <button class="modal-confirm-btn" @click="$emit('next')">{{ t('collectionSettings.finishNotice.next') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="FinishNoticeModal">
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
.finish-notice-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
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
    background-color: #ffffff;
    border-radius: 12px;
    padding: 18px 30px 24px;

    .close-btn {
      position: absolute;
      top: 20px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 500;
      color: #364153;
      margin-bottom: 24px;
      text-align: center;
    }

    .modal-message {
      font-size: 14px;
      color: #364153;
      margin-bottom: 10px;
      line-height: 20px;
    }

    .modal-notice {
      margin-bottom: 24px;
      font-size: 14px;
      color: #6A7282;

      .notice-label {
        margin: 0 0 10px;
      }

      .notice-content{
        line-height: 20px;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #FB64B6;
        }
      }

      .modal-confirm-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background: #FB64B6;
        color: #ffffff;
        position: relative;
        overflow: hidden;

        &:hover {
          &::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  }
}
</style>