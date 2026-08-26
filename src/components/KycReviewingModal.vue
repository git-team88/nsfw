<template>
  <div v-if="visible" class="modal-mask">
    <div class="modal">
      <button class="modal-close" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="modal-message" v-html="message || t('user.subscription.kycReviewingMessage')"></div>
      <div class="modal-footer">
        <button class="btn btn-cancel" @click="handleClose">{{ t('home.styleSelect.cancel') }}</button>
        <button class="btn btn-confirm" @click="handleViewKyc">{{ t('user.subscription.viewKycInfo') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="KycReviewingModal">
import { useI18n } from 'vue-i18n';
import router from '@/router';

const { t } = useI18n();

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}

function handleViewKyc() {
  emit('close');
  router.push('/user-personal');
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 24px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  position: relative;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}
.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}
.modal-message {
  font-size: 14px;
  font-weight: 600;
  color: #f5f5f5;
  margin-bottom: 24px;
  text-align: center;
  line-height: 22px;
  padding-top: 8px;
}
.modal-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 136px;
  height: 48px;
  padding: 0 24px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.1s;
}
.btn-cancel {
  background: #1a1a1a;
  color: #f5f5f5;
  border: 1px solid #3d3d3d;

  &:hover {
    background: rgba(255,255,255,0.06);
  }
}
.btn-confirm {
  background: linear-gradient(145deg, #ff74b3, #f73382);
  color: #f5f5f5;
  border: 1px solid #3d3d3d;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
