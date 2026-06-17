<template>
  <div v-if="visible" class="coupon-modal-overlay" @click.self="handleClose">
    <div class="coupon-modal">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="handleClose" />

      <div class="modal-header">
        <span class="modal-title">{{ t('coupon.addCoupon') }}</span>
      </div>

      <div class="modal-body">
        <div class="input-label">{{ t('coupon.inputCoupon') }}</div>
        <input
          v-model="couponCode"
          type="text"
          class="coupon-input"
          :placeholder="t('coupon.inputCoupon')"
          @keyup.enter="handleConfirm"
        />
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      </div>

      <div class="modal-footer">
        <button class="confirm-btn" :disabled="!couponCode.trim() || isLoading" :class="{ loading: isLoading }" @click="handleConfirm">
          <span>{{ t('coupon.confirm') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', info: { code: string; type: number; discountValue: number; info?: string }): void;
}>();

const couponCode = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    couponCode.value = '';
    errorMessage.value = '';
  }
});

function handleClose() {
  errorMessage.value = '';
  emit('close');
}

async function handleConfirm() {
  if (!couponCode.value.trim()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const res = await api.checkPromoCode({ promo_code: couponCode.value.trim() }) as any;

    if (res.code == 0) {
      const template = res.data?.template || {};
      const couponInfo = res.data?.info || {};
      emit('confirm', couponInfo);
    } else {
      errorMessage.value = locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp;
    }
  } catch (error) {
    console.error('Error checking promo code:', error);
    errorMessage.value = t('fail');
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.coupon-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coupon-modal {
  position: relative;
  width: 52rem;
  background: #ffffff;
  border-radius: 1.2rem;
  box-shadow: 0 0.8rem 2.4rem rgba(0, 0, 0, 0.15);

  .close-btn {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-header {
    padding: 1.8rem 2.4rem;
    border-bottom: 1px solid #f5f5f5;

    .modal-title {
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
    }
  }

  .modal-body {
    padding: 1.8rem 2.4rem;
    border-bottom: 1px solid #f5f5f5;

    .input-label {
      font-size: 1.4rem;
      color: #6A7282;
      margin-bottom: 1.2rem;
    }

    .coupon-input {
      width: 100%;
      height: 4.8rem;
      padding: 0 1.6rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      color: #364153;
      outline: none;

      &::placeholder {
        color: #99A1AF;
      }

      &:focus {
        border-color: #fb64b6;
      }
    }

    .error-message {
      margin-top: 1rem;
      font-size: 1.2rem;
      color: #ff4d4f;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    padding: 1.8rem 0;

    .confirm-btn {
      width: 24rem;
      height: 4.8rem;
      background: #fb64b6;
      color: #ffffff;
      border: none;
      border-radius: 0.8rem;
      font-size: 1.6rem;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      &:hover:not(:disabled) {
        &:after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
        }
      }

      &:disabled {
        background: rgba(251, 100, 182, 0.5);
        cursor: not-allowed;
      }

      &.loading {
        pointer-events: none;
      }
    }
  }
}
</style>
