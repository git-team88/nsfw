<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />

      <div class="modal-header">
        <h3 class="modal-title">{{ t('collectionSettings.confirmDelete.title') }}</h3>
      </div>

      <div class="modal-body">
        <p class="confirm-text">{{ t('collectionSettings.confirmDelete.description') }}</p>

        <div class="collection-preview">
          <img :src="collection.cover" alt="" class="cover-image" />
          <div class="collection-info">
            <h4 class="collection-title">{{ collection.title }}</h4>
            <span class="collection-status">{{ getUpdatedText() }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="$emit('close')">{{ t('collectionSettings.confirmDelete.cancel') }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ t('collectionSettings.confirmDelete.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ConfirmDeleteModal">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  collection: {
    cover: string;
    title: string;
    chapterCount: number;
    type: string;
  };
}>();

defineEmits(['close', 'confirm']);

function handleOverlayClick() {
  // Don't close on overlay click for important actions
}

function getUpdatedText(): string {
  const type = props.collection.type;
  const count = props.collection.chapterCount;
  if (type === '2') {
    return t('collectionSettings.confirmDelete.updatedChapter', { count });
  } else {
    return t('collectionSettings.confirmDelete.updatedEpisode', { count });
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50rem;
  background-color: #ffffff;
  border-radius: 1.2rem;
  padding: 3.2rem;
  text-align: center;

  .close-btn {
    position: absolute;
    top: 2rem;
    right: 1.2rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.4rem;

    .modal-title {
      font-size: 1.8rem;
      font-weight: bold;
      color: #364153;
      margin: 0;
    }
  }

  .modal-body {
    margin-bottom: 2.4rem;

    .confirm-text {
      font-size: 1.4rem;
      color: #364153;
      line-height: 2rem;
      margin-bottom: 2rem;
      text-align: left;
    }

    .collection-preview {
      display: flex;
      background: #F9FAFB;
      border-radius: 1.2rem;

      .cover-image {
        width: 12.2rem;
        height: 16.4rem;
        object-fit: cover;
        border-radius: 0.8rem;
      }

      .collection-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1rem;

        .collection-title {
          font-size: 1.4rem;
          font-weight: 500;
          color: #364153;
          max-width: 100%;
          word-break: break-all;
          white-space: normal;
        }

        .collection-status {
          font-size: 1.4rem;
          color: #6A7282;
        }
      }
    }
  }


  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 2.4rem;

    button {
      min-width: 13.6rem;
      height: 4.8rem;
      border: none;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
    }

    .btn-cancel {
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #FB64B6;
      }
    }

    .btn-danger {
      background: #FB64B6;
      color: #ffffff;

      &:hover {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}
</style>