<template>
  <div class="confirm-mask" v-if="show">
    <div class="confirm-modal">
      <img
        class="confirm-close"
        src="@/assets/images/base/close.png"
        alt=""
        @click="$emit('cancel')"
      />
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
  background: rgba(0, 0, 0, 0.3);
  z-index: 500;
}
.confirm-modal {
  position: relative;
  width: 50rem;
  padding: 4.4rem 2rem 2.4rem;
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: #ffffff;
}
.confirm-close {
  position: absolute;
  right: 1.2rem;
  top: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}
.confirm-text {
  margin-bottom: 2.4rem;
  font-size: 1.4rem;
  line-height: 2rem;
  text-align: center;
  color: #364153;
}
.confirm-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.4rem;
}
.confirm-btn {
  min-width: 13.6rem;
  height: 4.8rem;
  border: none;
  -webkit-border-radius: 0.8rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  &.secondary {
    border: 1px solid #fb64b6;
    background: none;
    color: #fb64b6;

    &:hover {
      background: rgba(251, 100, 182, 0.06);
    }
  }
  &.primary {
    background: #fb64b6;
    color: #ffffff;

    &:hover {
      position: relative;
      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        z-index: 1;
      }
    }
  }
}
</style>
