<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3>{{ t('submit.terms') }}</h3>
      </div>
      <div class="modal-body">
        <div class="convention-content" v-html="t('communityConvention')">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn cancel" @click="$emit('cancel')">{{ t('submit.cancelBtn') }}</button>
        <button class="btn confirm" @click="$emit('confirm')">{{ t('submit.confirmBtn') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'confirm']);
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  width: 680px;
  height: 470px;
  padding: 14px 0 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: #f5f5f5;
    margin: 0;
  }
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

.modal-body {
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;

  .convention-content {
    font-size: 14px;
    color: #f5f5f5;
    font-weight: 700;
    line-height: 20px;
    white-space: pre-line;
  }
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;

  .btn {
    min-width: 136px;
    height: 48px;
    border: 1px solid #3d3d3d;
    border-radius: 18px;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &.cancel {
      background: #1a1a1a;
      color: #f5f5f5;
      box-shadow: none;
      font-weight: 800;

      &:hover {
        border-color: #ff4f9a;
        color: #ff4f9a;
      }
    }

    &.confirm {
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      color: #ffffff;
      border: 1px solid #ff9aca;
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      font-weight: 800;

      &:hover {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }
    }
  }
}
</style>
