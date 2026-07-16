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
        <video
        :src="videoUrl"
        controls
        controlslist="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        autoplay></video>
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .preview-content {
    position: relative;
    width: 540px;
    padding: 24px 36px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 12px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
  .preview-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 18px;
    .title {
      font-size: 16px;
      font-weight: 500;
      color: #364153;
    }
  }
  .video-player {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 300px;
    border-radius: 8px;
    background: #F5F5F5;

    video {
      width: auto;
      height: 100%;
    }
  }
}
</style>