<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />

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
  background: rgba(0, 0, 0, 0.3);
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
  width: 50rem;
  padding: 4.4rem 2rem 2.4rem;
  background: #ffffff;
  border-radius: 1.2rem;
  gap: 2.4rem;
}

.close-btn {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-text {
  font-size: 1.4rem;
  color: #364153;
  text-align: center;
  line-height: 2rem;
}

.modal-buttons {
  display: flex;
  gap: 2.4rem;
  width: 100%;
  justify-content: center;
}

.btn {
  min-width: 13.6rem;
  height: 4.8rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #f2f4f7;
  color: #364153;
  &:hover {
    color: #fb64b6;
  }
}

.primary-btn {
  background: #fb64b6;
  color: #ffffff;

  &:hover {
    position: relative;
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      border-radius: inherit;
    }
  }
}
</style>