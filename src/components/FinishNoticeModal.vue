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
    width: 50rem;
    background-color: #ffffff;
    border-radius: 1.2rem;
    padding: 1.8rem 3rem 2.4rem;

    .close-btn {
      position: absolute;
      top: 2rem;
      right: 1.2rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin-bottom: 2.4rem;
      text-align: center;
    }

    .modal-message {
      font-size: 1.4rem;
      color: #364153;
      margin-bottom: 1rem;
      line-height: 2rem;
    }

    .modal-notice {
      margin-bottom: 2.4rem;
      font-size: 1.4rem;
      color: #6A7282;

      .notice-label {
        margin: 0 0 1rem;
      }

      .notice-content{
        line-height: 2rem;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 2.4rem;

      .modal-cancel-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #FB64B6;
        }
      }

      .modal-confirm-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
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