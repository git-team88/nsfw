<template>
  <div class="loading-mask" v-if="visible">
    <img src="@/assets/images/base/load.png" alt="Loading" />
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 500;

  img {
    width: 4rem;
    height: 4rem;
    animation: spin 1.5s linear infinite;
  }

  .cancel-btn {
    min-width: 13.6rem;
    height: 4.8rem;
    margin-top: 4rem;
    padding: 0 1.2rem;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    border: none;
    background: rgba(0, 0, 0, 0.5);
    color: #FFFFFF;
    cursor: pointer;
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
