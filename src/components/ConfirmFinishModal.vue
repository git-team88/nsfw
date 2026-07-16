<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(22, 17, 34, 0.4);
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
  background-color: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 12px;
  padding: 18px 30px 24px;

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

  .modal-header {
    margin-bottom: 24px;

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #161122;
      margin: 0;
      text-align: center;
    }
  }

  .modal-body {
    margin-bottom: 24px;

    .confirm-text {
      font-size: 14px;
      color: #161122;
      line-height: 20px;
      margin-bottom: 20px;
      text-align: left;
    }

    .collection-preview {
      display: flex;
      background: rgba(22, 17, 34, 0.06);
      border-radius: 12px;

      .cover-image {
        width: 122px;
        height: 164px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #161122;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);
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
          font-weight: 600;
          color: #161122;
          max-width: 100%;
          word-break: break-all;
          white-space: normal;
        }

        .collection-status {
          font-size: 14px;
          color: #5b5566;
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
      background: #FFFDF7;
      color: #5b5566;
      border: 2px solid #161122;
      box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

      &:hover {
        color: #FF4D8D;
        border-color: #FF4D8D;
      }
    }

    .btn-danger {
      background: #FF4D8D;
      color: #ffffff;
      border: 3px solid #161122;
      box-shadow: 2px 2px 0 #161122;

      &:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 #161122;
        }
        &:active {
          transform: translate(0, 0);
          box-shadow: 2px 2px 0 #161122;
        }
    }
  }
}
</style>
