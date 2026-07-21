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
$ink: #161122;
$pink: #FF4D8D;

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 500;

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #F3EFE7;
    border-top: 4px solid $ink;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .cancel-btn {
    min-width: 136px;
    height: 48px;
    margin-top: 32px;
    padding: 0 16px;
    background: #fff;
    border: 2.5px solid $ink;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    color: $ink;
    cursor: pointer;
    box-shadow: 3px 3px 0 $ink;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 $ink;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 $ink;
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
