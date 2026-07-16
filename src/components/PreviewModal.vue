<template>
  <div class="preview-modal" v-if="visible">
    <div class="preview-content">
      <button class="close-btn" @click="closeModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="preview-header">
        <span class="title">{{ t("submit.video.previewTitle") }}</span>
        <button class="close-btn" @click="closeModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
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
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .preview-content {
    position: relative;
    width: 540px;
    padding: 24px 36px;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    border-radius: 12px;
    overflow: hidden;
  }

  .close-btn {
    background: #fff;
    border: 2.5px solid #161122;
    border-radius: 999px;
    padding: 6px;
    position: absolute;
    top: 12px;
    right: 18px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    box-shadow: 2px 2px 0 #161122;
    transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10;

    &:hover {
      transform: scale(1.1);
    }
  }
  .preview-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 18px;
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #161122;
    }
  }
  .video-player {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 300px;
    border-radius: 8px;
    background: rgba(22, 17, 34, 0.06);

    video {
      width: auto;
      height: 100%;
    }
  }
}
</style>
