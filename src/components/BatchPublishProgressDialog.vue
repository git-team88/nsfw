<template>
  <div v-if="visible" class="batch-progress-overlay" @click.self="$emit('close')">
    <div class="batch-progress-dialog">
      <div class="dialog-header">
        <img class="close-icon" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />
        <span class="dialog-title">{{ t('novel.batchPublish.publishProgress') }}</span>
      </div>

      <div class="progress-message">
        <span class="message-text">{{ t('novel.batchPublish.publishingWait') }}</span>
      </div>

      <div class="progress-summary">
        <span class="progress-label">{{ t('novel.batchPublish.totalProgress', { current: completedCount, total: chapters.length }) }}</span>
      </div>

      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <div class="chapter-progress-list">
        <div
          v-for="(chapter, index) in chapters"
          :key="chapter.chapter"
          class="chapter-progress-item"
        >
          <span class="chapter-name">{{ t('chapter', { chapter: chapter.chapter }) }}</span>
          <div class="chapter-status-wrap">
            <img
              v-if="chapter.status === 'success'"
              class="status-icon"
              src="@/assets/images/publish/success_icon.png"
              alt=""
            />
            <img
              v-else-if="chapter.status === 'fail'"
              class="status-icon"
              src="@/assets/images/publish/fail_icon.png"
              alt=""
            />
            <img
              v-else-if="chapter.status === 'publishing'"
              class="status-icon rotating"
              src="@/assets/images/publish/loading.png"
              alt=""
            />
            <img
              v-else
              class="status-icon"
              src="@/assets/images/publish/loading.png"
              alt=""
            />
            <span
              class="status-text"
              :class="{
                success: chapter.status === 'success',
                fail: chapter.status === 'fail',
                publishing: chapter.status === 'publishing',
                waiting: chapter.status === 'waiting',
                unpublished: chapter.status === 'unpublished'
              }"
            >
              {{ chapter.status === 'success' ? t('novel.batchPublish.publishSuccess') : chapter.status === 'fail' ? t('novel.batchPublish.publishFail') : chapter.status === 'publishing' ? t('novel.batchPublish.publishing') : chapter.status === 'unpublished' ? t('novel.batchPublish.unpublished') : t('novel.batchPublish.waiting') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  chapters: { chapter: number; status: 'success' | 'fail' | 'publishing' | 'waiting' | 'unpublished' }[];
}>();

defineEmits(['close', 'complete']);

const completedCount = computed(() => props.chapters.filter(c => c.status === 'success').length);

const progressPercent = computed(() => {
  if (props.chapters.length === 0) return 0;
  return (completedCount.value / props.chapters.length) * 100;
});
</script>

<style lang="scss" scoped>
.batch-progress-overlay {
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

.batch-progress-dialog {
  background-color: #ffffff;
  border-radius: 1.2rem;
  width: 50rem;
  padding: 1.8rem 2rem 2rem;
  position: relative;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.4rem;
  position: relative;

  .close-icon {
    position: absolute;
    right: 0;
    top: 0.2rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }

  .dialog-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
    text-align: center;
    line-height: 2.4rem;
  }
}

.progress-message {
  margin-top: 2.4rem;

  .message-text {
    font-size: 1.4rem;
    color: #364153;
    line-height: 2rem;
  }
}

.progress-summary {
  margin-top: 1.6rem;

  .progress-label {
    font-size: 1.4rem;
    color: #6A7282;
    line-height: 2rem;
  }
}

.progress-bar-track {
  margin-top: 1rem;
  background-color: #F5F5F5;
  border-radius: 0.8rem;
  height: 0.8rem;
  width: 100%;

  .progress-bar-fill {
    background-color: #FB64B6;
    border-radius: 0.8rem;
    height: 100%;
    transition: width 0.3s ease;
  }
}

.chapter-progress-list {
  margin-top: 1.2rem;
  background-color: #F5F5F5;
  border-radius: 0.8rem;
  padding: 1.2rem;
  max-height: 20rem;
  overflow-y: auto;
}

.chapter-progress-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 2.2rem;
  margin-bottom: 1.2rem;

  &:last-child {
    margin-bottom: 0;
  }

  .chapter-name {
    font-size: 1.4rem;
    color: #6A7282;
    line-height: 2.2rem;
  }

  .chapter-status-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .status-icon {
      width: 1.8rem;
      height: 1.8rem;
    }

    .status-icon.rotating {
      animation: spin 1s linear infinite;
    }

    .status-text {
      font-size: 1.4rem;
      line-height: 2.2rem;
      white-space: nowrap;

      &.success {
        color: #6A7282;
      }

      &.publishing {
        color: #6A7282;
      }

      &.waiting {
        color: #6A7282;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
