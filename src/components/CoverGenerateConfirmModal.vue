<template>
  <div v-if="visible" class="cover-generate-confirm-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <p class="modal-warning" v-html="t('novel.coverGenerateConfirmWarning')"></p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('cancel')">{{ t('novel.cancel') }}</button>
        <button class="modal-confirm-btn" @click="$emit('confirm')">{{ t('novel.coverGenerateConfirmBtn') }}</button>
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

<style lang="scss" scoped>
.cover-generate-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
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
    border-radius: 18px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    padding: 44px 40px 24px;

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

    .modal-warning {
      font-size: 12px;
      color: #aaa;
      margin-bottom: 24px;
      text-align: center;
      line-height: 18px;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: 1px solid #3d3d3d;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        background: #1a1a1a;
        color: #f5f5f5;
        box-shadow: none;

        &:hover {
          color: #ff4f9a;
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
        }
        &:active {
          box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
        }
      }

      .modal-confirm-btn {
        min-width: 136px;
        height: 48px;
        border: 1px solid #3d3d3d;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #ffffff;
        box-shadow: none;

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
