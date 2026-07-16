<template>
  <div v-if="visible" class="insufficient-balance-modal">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />

      <h3 class="modal-title">{{ t('novel.insufficientBalance') }}</h3>
      <p class="modal-message">
        <template v-if="(estimatedFrozenPower ?? 0) > 0">
          <span class="detail-line">{{ t('novel.insufficientBalanceDetailLine1', { estimated: estimatedFrozenPower }) }}</span>
          <span class="detail-line">{{ t('novel.insufficientBalanceDetailLine2', { available: availableBalance ?? 0, frozen: systemFrozenBalance ?? 0 }) }}</span>
        </template>
        <template v-else>
          {{ t('novel.insufficientBalanceMessage') }}
        </template>
      </p>
      <div class="modal-actions">
        <button class="modal-cancel-btn" @click="$emit('cancel')">{{ t('novel.cancel') }}</button>
        <button class="modal-recharge-btn" @click="$emit('recharge')">{{ t('novel.goRecharge') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  estimatedFrozenPower?: number;
  availableBalance?: number;
  systemFrozenBalance?: number;
}>();

const emit = defineEmits<{
  cancel: [];
  recharge: [];
}>();
</script>

<style lang="scss" scoped>
.insufficient-balance-modal {
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
    padding: 24px;

    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 500;
      color: #364153;
      margin-bottom: 36px;
      text-align: center;
    }

    .modal-message {
      font-size: 14px;
      color: #6A7282;
      margin-bottom: 34px;
      text-align: center;
      line-height: 1.6;

      .detail-line {
        display: block;
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
        -webkit-border-radius: 8px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        background: #F5F5F5;
        color: #6A7282;

        &:hover {
          color: #fb64b6;
        }
      }

      .modal-recharge-btn {
        min-width: 136px;
        height: 48px;
        border: none;
        -webkit-border-radius: 8px;
        border-radius: 8px;
        font-size: 14px;
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