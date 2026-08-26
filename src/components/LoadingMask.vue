<template>
  <div class="loading-mask" v-if="visible">
    <div class="loading-spinner"></div>
    <button class="cancel-btn" v-if="showCancel" @click="emit('cancel')">{{ cancelText || t('novel.batchPublish.cancelOperation') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(defineProps<{
  visible: boolean;
  showCancel?: boolean;
  cancelText?: string;
}>(), {
  showCancel: true,
});

const emit = defineEmits<{
  cancel: [];
}>();
</script>

<style scoped lang="scss">
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 500;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #3d3d3d;
    border-top: 4px solid #f5f5f5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .cancel-btn {
    min-width: 136px;
    height: 48px;
    margin-top: 32px;
    padding: 0 16px;
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 800;
    color: #f5f5f5;
    cursor: pointer;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      background: rgba(255,255,255,0.06);
    }

    &:active {
      transform: translate(0, 0);
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
