<template>
  <div v-if="visible" class="exit-confirm-modal">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />

      <p class="modal-message">{{ t('novel.outlineEditConfirmExitMsg') }}</p>
      <div class="modal-actions">
        <button class="modal-exit-btn" @click="$emit('cancel')">{{ t('novel.continueEditBtn') }}</button>
        <button class="modal-cancel-btn" @click="$emit('confirm')">{{ t('novel.confirmExitBtn') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<style scoped lang="scss">
.exit-confirm-modal {
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
    padding: 44px 30px 24px;

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
      margin-bottom: 24px;
      text-align: center;
      line-height: 20px;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

      .modal-exit-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
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
