<template>
  <div v-if="visible" class="modal-mask" @click.self="handleClose">
    <div class="modal">
      <button class="modal-close" @click="handleClose">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
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
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 24px;
  border-radius: 13px;
  background: #FEFDF8;
  border: 2.5px solid #161122;
  position: relative;
  box-shadow: 3px 3px 0 #161122;
}
.modal-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
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
  color: #161122;
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
  border-radius: 13px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-cancel {
  background: #FFFFFF;
  color: #161122;
  border: 2.5px solid #161122;
  box-shadow: 3px 3px 0 #161122;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}
.btn-confirm {
  background: #FF4D8D;
  color: #FFFDF7;
  border: 2.5px solid #161122;
  box-shadow: 3px 3px 0 #161122;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #161122;
  }
  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 #161122;
  }
}
</style>
