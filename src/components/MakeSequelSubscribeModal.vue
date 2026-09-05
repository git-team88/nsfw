<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-header">
        <h3>{{ t('home.makeSequelSubscribeTitle') }}</h3>
      </div>

      <div class="modal-footer">
        <button class="btn confirm" @click="$emit('go-subscribe')">{{ t('home.makeSequelSubscribeGo') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="MakeSequelSubscribeModal">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

defineEmits(['go-subscribe', 'close']);
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
  width: 500px;
  max-width: 90vw;
  padding: 14px 24px 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 22px;

  h3 {
    font-size: 16px;
    font-weight: 800;
    color: #f5f5f5;
    margin: 0;
    text-align: center;
    line-height: 22px;
  }
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 24px;

  .btn {
    min-width: 136px;
    height: 48px;
    border: 1px solid #3d3d3d;
    border-radius: 18px;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

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
