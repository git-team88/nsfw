<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />

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
import { defineProps, defineEmits } from 'vue';
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  width: 68rem;
  height: 47rem;
  padding: 1.4rem 0 2.4rem;
  background: #ffffff;
  border-radius: 1.2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2.4rem;

  h3 {
    font-size: 1.8rem;
    color: #364153;
    margin: 0;
  }
}

.close-btn {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  padding: 0 2rem;
  overflow-y: auto;

  .convention-content {
    font-size: 1.4rem;
    color: #364153;
    line-height: 2rem;
    white-space: pre-line;
  }
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 2.4rem;
  margin-top: 2.4rem;

  .btn {
    min-width: 13.6rem;
    height: 4.8rem;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &.cancel {
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #fb64b6;
      }
    }

    &.confirm {
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
  }
}
</style>