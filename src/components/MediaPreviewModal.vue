<template>
  <div class="media-preview-mask" v-if="visible" @click="close">
    <div class="media-preview-content" @click.stop>
      <button class="media-preview-close" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
      <img v-if="type === 'image'" :src="url" alt="" class="media-preview-img" />
      <video v-else-if="type === 'video'" :src="url" controls autoplay class="media-preview-video"></video>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  type: 'image' | 'video';
  url: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

function close() {
  emit('update:visible', false);
  emit('close');
}
</script>

<style scoped lang="scss">
.media-preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;

  .media-preview-content {
    position: relative;

    .media-preview-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: rgba(26, 26, 26, 0.85);
      border: 1px solid #3d3d3d;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1) rotate(90deg);
      }
    }

    .media-preview-img {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 18px;
      object-fit: contain;
    }

    .media-preview-video {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 18px;
    }
  }
}
</style>
