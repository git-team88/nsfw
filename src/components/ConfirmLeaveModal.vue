<template>
  <div class="confirm-mask" v-if="show">
    <div class="confirm-modal">
      <button class="confirm-close" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
      <p class="confirm-text">{{ t("submit.confirm.leaveTip") }}</p>
      <div class="confirm-actions">
        <button class="confirm-btn secondary" @click="$emit('cancel')">
          {{ t("submit.confirm.continueEdit") }}
        </button>
        <button class="confirm-btn primary" @click="$emit('confirm')">
          {{ t("submit.confirm.confirmExit") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
defineProps<{ show: boolean }>();
const { t, locale } = useI18n();
</script>

<style scoped lang="scss">
.confirm-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
  z-index: 500;
}
.confirm-modal {
  position: relative;
  width: 500px;
  padding: 44px 20px 24px;
  border-radius: 18px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}
.confirm-close {
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
.confirm-text {
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: #f5f5f5;
  font-weight: 700;
}
.confirm-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
.confirm-btn {
  min-width: 136px;
  height: 48px;
  border-radius: 14px;
  font-size: 14px;
  cursor: pointer;
  &.secondary {
    background: #1a1a1a;
    color: #f5f5f5;
    border: 1px solid #3d3d3d;
    box-shadow: none;
    font-weight: 800;

    &:hover {
      border-color: #ff4f9a;
      color: #ff4f9a;
    }
  }
  &.primary {
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    color: #ffffff;
    border: 1px solid #ff9aca;
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    font-weight: 800;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }
  }
}
</style>
