<template>
  <div class="preview-modal" v-if="visible">
    <div class="preview-content">
      <img
        src="@/assets/images/base/close.png"
        class="close-btn"
        @click="closeModal"
      />

      <div class="preview-header">
        <span class="title">{{ t("submit.video.previewTitle") }}</span>
        <img
          src="@/assets/images/base/close.png"
          class="close-btn"
          @click="closeModal"
        />
      </div>
      <div class="video-player">
        <video :src="videoUrl" controls autoplay></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  visible: boolean;
  videoUrl: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { t, locale } = useI18n();

const closeModal = () => {
  emit("close");
};
</script>

<style scoped lang="scss">
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .preview-content {
    position: relative;
    width: 100%;
    max-width: 100%;
    height: 90vh;
    max-height: 100%;
    padding: 0;
    background: transparent;
    border-radius: 0;
    overflow: hidden;
  }

  .close-btn {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 3rem;
    height: 3rem;
    cursor: pointer;
    z-index: 10;
  }
  .preview-header {
    display: none;
  }
  .video-player {
    width: 100%;
    height: 100%;
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>