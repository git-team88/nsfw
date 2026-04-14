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
    padding: 4.4rem 2.4rem 2.4rem;

    .modal-message {
      font-size: 1.4rem;
      color: #6A7282;
      margin-bottom: 2.4rem;
      text-align: center;
      line-height: 1.6;

      :deep(span) {
        color: #FB64B6;
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
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .modal-confirm-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        border: none;
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