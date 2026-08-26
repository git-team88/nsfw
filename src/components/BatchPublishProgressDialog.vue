<template>
  <div v-if="visible" class="batch-progress-overlay">
    <div class="batch-progress-dialog">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="dialog-header">
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
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.batch-progress-dialog {
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  width: 500px;
  padding: 18px 24px 24px;
  position: relative;
  animation: tdIn .3s cubic-bezier(.16,1,.3,1) both;
}

.close-btn {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 50%;
  padding: 0;
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
  transition: transform .2s;
  z-index: 10;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  position: relative;

  .dialog-title {
    font-size: 16px;
    font-weight: 800;
    color: #f5f5f5;
    text-align: center;
    line-height: 24px;
  }
}

.progress-message {
  margin-top: 24px;

  .message-text {
    font-size: 14px;
    font-weight: 600;
    color: #f5f5f5;
    line-height: 20px;
  }
}

.progress-summary {
  margin-top: 16px;

  .progress-label {
    font-size: 14px;
    font-weight: 700;
    color: #aaa;
    line-height: 20px;
  }
}

.progress-bar-track {
  margin-top: 10px;
  background-color: #2c2c2c;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
  height: 10px;
  width: 100%;

  .progress-bar-fill {
    background: linear-gradient(90deg, #ff4f9a, #FF9E45);
    border-radius: 999px;
    height: 100%;
    transition: width 0.3s cubic-bezier(.16,1,.3,1);
  }
}

.chapter-progress-list {
  margin-top: 16px;
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  box-shadow: none;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.chapter-progress-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: #1a1a1a;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  .chapter-name {
    font-size: 14px;
    font-weight: 700;
    color: #f5f5f5;
    line-height: 22px;
  }

  .chapter-status-wrap {
    display: flex;
    align-items: center;
    gap: 6px;

    .status-icon {
      width: 18px;
      height: 18px;
    }

    .status-icon.rotating {
      animation: spin 1s linear infinite;
    }

    .status-text {
      font-size: 13px;
      font-weight: 700;
      line-height: 22px;
      white-space: nowrap;

      &.success {
        color: #22C55E;
      }

      &.fail {
        color: #E5484D;
      }

      &.publishing {
        color: #ff4f9a;
      }

      &.waiting {
        color: #777;
      }

      &.unpublished {
        color: #F59E0B;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes tdIn {
  0% { opacity: 0; transform: scale(.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
