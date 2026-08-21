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
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: relative;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    border-radius: 12px;
    width: 500px;
    padding: 18px 30px 24px;

    .modal-message {
      font-size: 14px;
      color: #5b5566;
      margin-bottom: 24px;
      text-align: center;
      line-height: 1.6;

      :deep(span) {
        color: #FF4D8D;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 24px;

      .modal-cancel-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        background: #FFFFFF;
        color: #161122;
        box-shadow: 2px 2px 0 #161122;

        &:hover {
          color: #FF4D8D;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }

      .modal-confirm-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        background: #FF4D8D;
        color: #ffffff;
        box-shadow: 2px 2px 0 #161122;

        &:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
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