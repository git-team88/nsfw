<template>
  <div v-if="visible" class="generate-all-chapters-modal">
    <div class="modal-content">
      <p class="modal-message" v-html="t('novel.estimatedConsumption', { power: computingPower, time: estimatedTime })"></p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('cancel')">{{ t('novel.cancel') }}</button>
        <button class="modal-confirm-btn" @click="$emit('confirm')">{{ t('novel.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  computingPower: number;
  estimatedTime: string;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<style lang="scss" scoped>
.generate-all-chapters-modal {
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
    position: relative;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    border-radius: 18px;
    width: 500px;
    padding: 18px 30px 24px;

    .modal-message {
      font-size: 14px;
      color: #aaa;
      margin-bottom: 24px;
      text-align: center;
      line-height: 1.6;

      :deep(span) {
        color: #ff4f9a;
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
        color: #f5f5f5;
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