<template>
  <div v-if="visible" class="insufficient-balance-modal">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />

      <h3 class="modal-title">{{ t('novel.insufficientBalance') }}</h3>
      <p class="modal-message">
        <!-- <template v-if="estimatedPower !== undefined && estimatedPower > 0 && availableBalance !== undefined && availableBalance >= 0 && frozenBalance !== undefined && frozenBalance >= 0">
          {{ t('novel.insufficientBalanceDetail', {
            estimated: estimatedPower,
            available: availableBalance,
            frozen: frozenBalance
          }) }}
        </template> -->
        <!-- <template v-else> -->
          {{ t('novel.insufficientBalanceMessage') }}
        <!-- </template> -->
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
  estimatedPower?: number;
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
    width: 50rem;
    background-color: #ffffff;
    border-radius: 1.2rem;
    padding: 2.4rem;

    .close-btn {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
      margin-bottom: 3.6rem;
      text-align: center;
    }

    .modal-message {
      font-size: 1.4rem;
      color: #6A7282;
      margin-bottom: 3.4rem;
      text-align: center;
      line-height: 1.6;
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

      .modal-recharge-btn {
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