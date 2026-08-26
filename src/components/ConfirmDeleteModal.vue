<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background-color: rgba(0,0,0,0.5);
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
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 18px;
  padding: 32px;
  text-align: center;

  .close-btn {
    background: #1a1a1a;
    border: 1px solid #3d3d3d;
    border-radius: 999px;
    padding: 6px;
    position: absolute;
    top: 12px;
    right: 18px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 10;

    &:hover { transform: scale(1.1) rotate(90deg); }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .modal-title {
      font-size: 18px;
      font-weight: bold;
      color: #f5f5f5;
      margin: 0;
    }
  }

  .modal-body {
    margin-bottom: 24px;

    .confirm-text {
      font-size: 14px;
      color: #f5f5f5;
      line-height: 20px;
      margin-bottom: 20px;
      text-align: left;
    }

    .collection-preview {
      display: flex;
      background: rgba(255,255,255,0.06);
      border-radius: 18px;

      .cover-image {
        width: 122px;
        height: 164px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid #3d3d3d;
        box-shadow: none;
      }

      .collection-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px;

        .collection-title {
          font-size: 14px;
          font-weight: 600;
          color: #f5f5f5;
          max-width: 100%;
          word-break: break-all;
          white-space: normal;
        }

        .collection-status {
          font-size: 14px;
          color: #aaa;
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
      background: #1a1a1a;
      color: #aaa;
      border: 1px solid #3d3d3d;
      box-shadow: none;

      &:hover {
        color: #ff4f9a;
        border-color: #ff4f9a;
      }
    }

    .btn-danger {
      background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
      color: #ffffff;
      border: 1px solid #ff9aca;
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);

      &:hover:not(:disabled) {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }
      &:active {
        box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
      }
    }
  }
}
</style>
