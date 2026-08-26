<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-text">
        {{ t('subscription.prompt') }}
      </div>
      <div class="modal-buttons">
        <button class="btn cancel-btn" @click="$emit('cancel')">{{ t('subscription.returnEdit') }}</button>
        <button class="btn primary-btn" @click="$emit('goToSettings')">{{ t('subscription.goToSettings') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SubscriptionPromptModal">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'goToSettings']);
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 500px;
  padding: 44px 20px 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  border-radius: 18px;
  gap: 24px;
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

.modal-text {
  font-size: 14px;
  color: #f5f5f5;
  font-weight: 700;
  text-align: center;
  line-height: 20px;
}

.modal-buttons {
  display: flex;
  gap: 24px;
  width: 100%;
  justify-content: center;
}

.btn {
  min-width: 136px;
  height: 48px;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
}

.cancel-btn {
  background: #1a1a1a;
  color: #f5f5f5;
  box-shadow: none;
  font-weight: 800;
  &:hover {
    border-color: #ff4f9a;
    color: #ff4f9a;
  }
}

.primary-btn {
  background: linear-gradient(145deg, #ff74b3, #f73382);
  color: #f5f5f5;
  box-shadow: none;
  font-weight: 800;

  &:hover {
    box-shadow: none;
  }
}
</style>
