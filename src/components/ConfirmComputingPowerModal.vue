<template>
  <div v-if="visible" class="confirm-computing-power-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <p class="modal-message" v-html="t('novel.confirmComputingPowerPrefix', { power: `<span class='computing-power-value'>${computingPower}</span>` }) + ((frozenPower ?? 0) > 0 ? `<span class='modal-frozen'>${t('novel.confirmComputingPowerFrozen', { frozen: `<span class='computing-power-value'>${frozenPower}</span>` })}</span>` : '') + t('novel.confirmComputingPowerSuffix')"></p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('cancel')">{{ t('novel.cancel') }}</button>
        <button class="modal-confirm-btn" @click="$emit('confirm')">{{ t('novel.confirmGenerate') }}</button>
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
  frozenPower?: number;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>

<style lang="scss" scoped>
.confirm-computing-power-modal {
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
    position: relative;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    border-radius: 18px;
    width: 500px;
    padding: 50px 30px 24px;

    .close-btn {
      background: #1a1a1a;
      border: 1px solid #3d3d3d;
      border-radius: 999px;
      padding: 6px;
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      box-shadow: none;
      transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10;

      &:hover { transform: scale(1.1) rotate(90deg); }
    }

    .modal-message {
      font-size: 14px;
      color: #f5f5f5;
      margin-bottom: 24px;
      text-align: center;
      line-height: 20px;

      :deep(.computing-power-value) {
        margin: 0 4px;
        color: #ff4f9a;
      }

      :deep(.modal-frozen) {
        color: #aaa;
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
        background: #1a1a1a;
        color: #aaa;
        border: 1px solid #3d3d3d;
        box-shadow: none;

        &:hover {
          box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
          color: #ff4f9a;
          border-color: #ff4f9a;
        }
      }

      .modal-confirm-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
        color: #ffffff;
        border: 1px solid #ff9aca;
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
