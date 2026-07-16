<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />

      <div class="modal-header">
        <h3 class="modal-title">{{ t('collectionSettings.confirmFinish.title') }}</h3>
      </div>

      <div class="modal-body">
        <p class="confirm-text">{{ t('collectionSettings.confirmFinish.description') }}</p>

        <div class="collection-preview">
          <img :src="collection.cover" alt="" class="cover-image" />
          <div class="collection-info">
            <h4 class="collection-title">{{ collection.title }}</h4>
            <span class="collection-status">{{ getUpdatedText() }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="$emit('close')">{{ t('collectionSettings.confirmFinish.cancel') }}</button>
        <button class="btn btn-danger" @click="$emit('confirm')">{{ t('collectionSettings.confirmFinish.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ConfirmFinishModal">
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
    return t('collectionSettings.confirmFinish.updatedChapter', { count });
  } else {
    return t('collectionSettings.confirmFinish.updatedEpisode', { count });
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
  width: 500px;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 18px 30px 24px;

  .close-btn {
    position: absolute;
    top: 20px;
    right: 12px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .modal-header {
    margin-bottom: 24px;

    .modal-title {
      font-size: 16px;
      font-weight: 500;
      color: #364153;
      margin: 0;
      text-align: center;
    }
  }

  .modal-body {
    margin-bottom: 24px;

    .confirm-text {
      font-size: 14px;
      color: #364153;
      line-height: 20px;
      margin-bottom: 20px;
      text-align: left;
    }

    .collection-preview {
      display: flex;
      background: #F9FAFB;
      border-radius: 12px;

      .cover-image {
        width: 122px;
        height: 164px;
        object-fit: cover;
        border-radius: 8px;
      }

      .collection-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px;

        .collection-title {
          white-space: wrap;
          font-size: 14px;
          font-weight: 500;
          color: #364153;
          max-width: 100%;
          word-break: break-all;
          white-space: normal;
        }

        .collection-status {
          font-size: 14px;
          color: #6A7282;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    gap: 24px;

    button {
      min-width: 136px;
      height: 48px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-cancel {
      background: #F5F5F5;
      color: #6A7282;

      &:hover {
        color: #fb64b6;
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