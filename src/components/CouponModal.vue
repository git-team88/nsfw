<template>
  <div v-if="visible" class="coupon-modal-overlay">
    <div class="coupon-modal">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coupon-modal {
  position: relative;
  width: 520px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);

  @media (max-width: 640px) {
    width: 90%;
    border-radius: 18px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  }

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

  .modal-header {
    padding: 18px 24px;
    border-bottom: 1px solid #3d3d3d;

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #f5f5f5;
    }
  }

  .modal-body {
    padding: 24px;
    border-bottom: 1px solid #3d3d3d;

    .input-label {
      font-size: 14px;
      font-weight: 800;
      color: #aaa;
      margin-bottom: 12px;
    }

    .coupon-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border: 1px solid #3d3d3d;
      border-radius: 18px;
      font-size: 14px;
      font-weight: 700;
      color: #f5f5f5;
      outline: none;
      background: #1a1a1a;
      box-shadow: none;
      transition: border-color 0.15s, box-shadow 0.15s;

      &::placeholder {
        color: #777;
        font-weight: 600;
      }

      &:focus {
        border-color: #ff4f9a;
        box-shadow: none;
      }
    }

    .error-message {
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #ff4f9a;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    padding: 20px 24px;

    .confirm-btn {
      width: 100%;
      max-width: 240px;
      height: 48px;
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #ffffff;
      border: 1px solid #ff9aca;
      border-radius: 13px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;

      &:hover:not(:disabled) {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }

      &:active:not(:disabled) {
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.loading {
        pointer-events: none;
        opacity: 0.5;
      }
    }
  }
}
</style>
