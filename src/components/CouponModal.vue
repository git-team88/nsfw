<template>
  <div v-if="visible" class="coupon-modal-overlay" @click.self="handleClose">
    <div class="coupon-modal">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.coupon-modal {
  position: relative;
  width: 520px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  .close-btn {
    background: none;
    border: none;
    padding: 0;
    position: absolute;
    top: 20px;
    right: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-header {
    padding: 18px 24px;
    border-bottom: 1px solid rgba(22, 17, 34, 0.12);

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #161122;
    }
  }

  .modal-body {
    padding: 18px 24px;
    border-bottom: 1px solid rgba(22, 17, 34, 0.12);

    .input-label {
      font-size: 14px;
      color: #5b5566;
      margin-bottom: 12px;
    }

    .coupon-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      color: #161122;
      outline: none;

      &::placeholder {
        color: #9a93a4;
      }

      &:focus {
        border-color: #FF4D8D;
      }
    }

    .error-message {
      margin-top: 10px;
      font-size: 12px;
      color: #ff4d4f;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    padding: 18px 0;

    .confirm-btn {
      width: 240px;
      height: 48px;
      background: #FF4D8D;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      &:hover:not(:disabled) {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }
      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
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
