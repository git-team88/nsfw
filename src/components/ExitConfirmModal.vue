<template>
  <div v-if="visible" class="exit-confirm-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(22, 17, 34, 0.4);
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
    background-color: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    border-radius: 12px;
    padding: 56px 30px 28px;

    .close-btn {
      background: #fff;
      border: 2.5px solid #161122;
      border-radius: 999px;
      padding: 6px;
      position: absolute;
      top: 12px;
      right: 18px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      box-shadow: 2px 2px 0 #161122;
      transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10;

      &:hover {
        transform: scale(1.1);
      }
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
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
        border: 2.5px solid #161122;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FFFDF7;
        color: #161122;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s, color 0.2s;

        &:hover {
          color: #FF4D8D;
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FF4D8D;
        color: #ffffff;
        box-shadow: 3px 3px 0 #161122;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

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
