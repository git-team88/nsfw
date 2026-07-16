<template>
  <div class="confirm-mask" v-if="show">
    <div class="confirm-modal">
      <button class="confirm-close" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
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
  background: rgba(22, 17, 34, 0.4);
  z-index: 500;
}
.confirm-modal {
  position: relative;
  width: 500px;
  padding: 44px 20px 24px;
  border-radius: 14px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
}
.confirm-close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.confirm-text {
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: #161122;
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
    background: #ffffff;
    color: #161122;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 #161122;
    font-weight: 800;

    &:hover {
      border-color: #FF4D8E;
      color: #FF4D8E;
    }
  }
  &.primary {
    background: linear-gradient(135deg, #FF4D8D, #FF7A45);
    color: #ffffff;
    border: 2px solid #161122;
    box-shadow: 2px 2px 0 #161122;
    font-weight: 800;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 3px 3px 0 #161122;
    }
  }
}
</style>
