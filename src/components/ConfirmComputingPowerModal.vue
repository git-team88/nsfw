<template>
  <div v-if="visible" class="confirm-computing-power-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
    background-color: #ffffff;
    border-radius: 12px;
    padding: 44px 30px 24px;

    .close-btn {
      background: none;
      border: none;
      padding: 0;
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
      margin-bottom: 24px;
      text-align: center;
      line-height: 20px;

      :deep(.computing-power-value) {
        margin: 0 4px;
        color: #FF4D8D;
      }

      :deep(.modal-frozen) {
        color: #5b5566;
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
        background: rgba(22, 17, 34, 0.06);
        color: #5b5566;

        &:hover {
          color: #FF4D8D;
        }
      }

      .modal-confirm-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        border: none;
        background: #FF4D8D;
        color: #ffffff;

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
