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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;

  img {
    width: 4rem;
    height: 4rem;
    animation: rotate 1.5s linear infinite;
  }

  p {
    margin-top: 1.6rem;
    font-size: 1.4rem;
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