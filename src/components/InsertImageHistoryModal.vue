<template>
  <div v-if="visible" class="insert-image-history-modal" @click="$emit('cancel')">
    <div class="insert-image-history-content" @click.stop>
      <div class="insert-image-history-header">
        <h3 class="insert-image-history-title">{{ t('novel.imageHistoryTitle') }}</h3>
        <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('cancel')" />
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .insert-image-history-content {
    position: relative;
    background: #FFFFFF;
    border-radius: 1.2rem;
    width: 72rem;
    padding: 1.8rem 0;
    display: flex;
    flex-direction: column;

    .insert-image-history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.8rem 1.8rem 2.4rem;
      border-bottom: 1px solid #F5F5F5;

      .insert-image-history-title {
        font-size: 1.6rem;
        font-weight: 500;
        color: #364153;
        text-align: left;
        margin: 0;
      }

      .close-btn {
        width: 2rem;
        height: 2rem;
        cursor: pointer;
      }
    }

    .insert-image-history-list {
      display: grid;
      grid-template-columns: repeat(3, 21rem);
      gap: 1.2rem;
      justify-content: center;
      max-height: 48rem;
      padding: 2rem 1rem 2rem 2.4rem;
      overflow-y: auto;

      .insert-image-history-item {
        width: 21rem;
        height: 21rem;
        border-radius: 0.8rem;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        border: 0.2rem solid transparent;
        background: #F5F5F5;

        &.active {
          border-color: #FB64B6;
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
          background: #F5F5F5;

          .spinner {
            width: 3rem;
            height: 3rem;
            border: 0.3rem solid #E0E0E0;
            border-top-color: #FB64B6;
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
      height: 20rem;
      font-size: 1.4rem;
      color: #99A1AF;
      padding: 0 3rem 4rem;
    }

    .insert-image-history-footer {
      padding: 1.8rem 3rem 0;
      border-top: 1px solid #F5F5F5;
      display: flex;
      justify-content: center;

      .confirm-btn {
        min-width: 13.6rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        background: #FB64B6;
        color: #ffffff;

        &:hover {
          position: relative;

          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
          }
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
