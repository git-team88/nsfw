<template>
  <div v-if="visible" class="insert-image-history-modal" @click="$emit('cancel')">
    <div class="insert-image-history-content" @click.stop>
      <div class="insert-image-history-header">
        <h3 class="insert-image-history-title">{{ t('novel.imageHistoryTitle') }}</h3>
        <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
      </div>
      <div class="insert-image-history-list">
        <div
          v-for="(imageUrl, index) in reversedImageList"
          :key="index"
          class="insert-image-history-item"
          :class="{ active: imageUrl == selectedImage }"
          @click="selectedImage = imageUrl"
        >
          <div v-if="!loadedImages[index]" class="insert-image-history-spinner">
            <div class="spinner"></div>
          </div>
          <img :src="imageUrl + '?imageMogr2/format/webp/quality/60'" alt="" @load="onImageLoad(index)" @error="onImageLoad(index)" />
        </div>
      </div>
      <div v-if="imageList.length == 0" class="insert-image-history-empty">
        <span>{{ t('novel.imageHistoryEmpty') }}</span>
      </div>
      <div class="insert-image-history-footer" v-if="imageList.length > 0">
        <button class="cancel-btn" @click="$emit('cancel')">{{ t('novel.cancel') }}</button>
        <button class="confirm-btn" @click="handleConfirm">{{ t('novel.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  imageList: string[];
  currentImage: string;
}>();

const emit = defineEmits<{
  cancel: [];
  select: [imageUrl: string];
}>();

const selectedImage = ref<string>('');
const loadedImages = ref<Record<number, boolean>>({});

const reversedImageList = computed(() => [...props.imageList].reverse());

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedImage.value = props.currentImage;
    loadedImages.value = {};
  }
});

watch(() => props.imageList, () => {
  loadedImages.value = {};
});

const onImageLoad = (index: number) => {
  loadedImages.value[index] = true;
};

const handleConfirm = () => {
  if (selectedImage.value) {
    emit('select', selectedImage.value);
  }
};
</script>

<style scoped lang="scss">
.insert-image-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .insert-image-history-content {
    position: relative;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 #161122;
    border-radius: 12px;
    width: 720px;
    padding: 18px 0;
    display: flex;
    flex-direction: column;

    .insert-image-history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px 18px 24px;
      border-bottom: 1px solid rgba(22, 17, 34, 0.12);

      .insert-image-history-title {
        font-size: 16px;
        font-weight: 600;
        color: #161122;
        text-align: left;
        margin: 0;
      }

      .close-btn {
        background: #fff;
        border: 2.5px solid #161122;
        border-radius: 999px;
        padding: 6px;
        width: 36px;
        height: 36px;
        cursor: pointer;
        box-shadow: 2px 2px 0 #161122;
        transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);

        &:hover { transform: scale(1.1) rotate(90deg); }
      }
    }

    .insert-image-history-list {
      display: grid;
      grid-template-columns: repeat(2, 300px);
      gap: 12px;
      justify-content: center;
      max-height: 480px;
      padding: 20px 10px 20px 24px;
      overflow-y: auto;

      .insert-image-history-item {
        width: 300px;
        height: 170px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        border: 2px solid transparent;
        background: rgba(22, 17, 34, 0.06);

        &.active {
          border-color: #FF4D8D;
        }

        .insert-image-history-spinner {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(22, 17, 34, 0.06);

          .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(22, 17, 34, 0.12);
            border-top-color: #FF4D8D;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .insert-image-history-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      font-size: 14px;
      color: #9a93a4;
      padding: 0 30px 40px;
    }

    .insert-image-history-footer {
      padding: 18px 30px 0;
      border-top: 1px solid rgba(22, 17, 34, 0.12);
      display: flex;
      justify-content: center;
      gap: 30px;

      .cancel-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FFFFFF;
        color: #161122;
        box-shadow: 2px 2px 0 #161122;

        &:hover {
          color: #FF4D8D;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }

      .confirm-btn {
        min-width: 136px;
        height: 48px;
        border: 2.5px solid #161122;
        border-radius: 13px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        background: #FF4D8D;
        color: #ffffff;
        box-shadow: 2px 2px 0 #161122;

        &:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
      }
    }
  }
}
</style>

<style lang="scss">
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
