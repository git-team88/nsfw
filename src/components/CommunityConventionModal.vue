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
  width: 680px;
  height: 470px;
  padding: 14px 0 24px;
  background: #ffffff;
  border-radius: 14px;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
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
    color: #161122;
    margin: 0;
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  padding: 0 20px;
  overflow-y: auto;

  .convention-content {
    font-size: 14px;
    color: #161122;
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
    border: 2px solid #161122;
    border-radius: 14px;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &.cancel {
      background: #FFFFFF;
      color: #161122;
      box-shadow: 2px 2px 0 #161122;
      font-weight: 800;

      &:hover {
        border-color: #FF4D8E;
        color: #FF4D8E;
      }
    }

    &.confirm {
      background: linear-gradient(135deg, #FF4D8D, #FF7A45);
      color: #ffffff;
      box-shadow: 2px 2px 0 #161122;
      font-weight: 800;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 3px 3px 0 #161122;
      }
    }
  }
}
</style>