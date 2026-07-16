<template>
  <div class="upload-mask" v-if="visible">
    <img src="@/assets/images/base/load.png" alt="Loading" />
    <p>{{ text ? text : t('upload') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps<{
  visible: boolean;
  text?: string;
}>();
</script>

<style scoped lang="scss">
.upload-mask {
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
  z-index: 10000;

  img {
    width: 40px;
    height: 40px;
    animation: rotate 1.5s linear infinite;
  }

  p {
    margin-top: 16px;
    font-size: 14px;
    color: #FFFFFF;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>