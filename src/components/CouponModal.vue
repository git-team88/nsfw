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
$ink: #161122;
$paper: #FFFDF7;
$cream: #FFFBF4;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;

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
  background: $paper;
  border: 3px solid $ink;
  border-radius: 16px;
  box-shadow: 6px 6px 0 $ink;

  @media (max-width: 640px) {
    width: 90%;
    border-radius: 14px;
    box-shadow: 4px 4px 0 $ink;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-header {
    padding: 18px 24px;
    border-bottom: 2.5px solid $ink;

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: $ink;
    }
  }

  .modal-body {
    padding: 24px;
    border-bottom: 2.5px solid $ink;

    .input-label {
      font-size: 14px;
      font-weight: 800;
      color: $sub;
      margin-bottom: 12px;
    }

    .coupon-input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      border: 2.5px solid $ink;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      color: $ink;
      outline: none;
      background: $cream;
      box-shadow: 2px 2px 0 $ink;
      transition: border-color 0.15s, box-shadow 0.15s;

      &::placeholder {
        color: $muted;
        font-weight: 600;
      }

      &:focus {
        border-color: $pink;
        box-shadow: 2px 2px 0 $pink;
      }
    }

    .error-message {
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: $pink;
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
      background: $pink;
      color: #ffffff;
      border: 2.5px solid $ink;
      border-radius: 13px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 3px 3px 0 $ink;
      transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;

      &:hover:not(:disabled) {
        transform: translate(-2px, -2px);
        box-shadow: 5px 5px 0 $ink;
      }

      &:active:not(:disabled) {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 $ink;
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
