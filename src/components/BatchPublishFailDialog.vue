<template>
  <div v-if="visible" class="batch-fail-overlay">
    <div class="batch-fail-dialog">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="dialog-header">
        <span class="dialog-title">{{ t('novel.batchPublish.publishProgress') }}</span>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">{{ t('novel.batchPublish.successLabel') }}</span>
          <span class="stat-value success">{{ successCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('novel.batchPublish.failLabel') }}</span>
          <span class="stat-value fail">{{ failCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('novel.batchPublish.unpublishedLabel') }}</span>
          <span class="stat-value unpublished">{{ unpublishedCount }}</span>
        </div>
      </div>

      <div class="fail-message" v-if="failMessage">
        <span>{{ failMessage }}</span>
      </div>

      <div class="action-row">
        <button class="exit-btn" @click="$emit('exit')">{{ t('novel.batchPublish.exitPublish') }}</button>
        <button class="retry-btn" @click="$emit('retry')">{{ t('novel.batchPublish.retryAndContinue') }}</button>
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
  chapters: { chapter: number; status: 'success' | 'fail' | 'unpublished' }[];
  failedChapter?: number;
}>();

defineEmits(['close', 'exit', 'retry']);

const successCount = computed(() => props.chapters.filter(c => c.status === 'success').length);
const failCount = computed(() => props.chapters.filter(c => c.status === 'fail').length);
const unpublishedCount = computed(() => props.chapters.filter(c => c.status === 'unpublished').length);

const failMessage = computed(() => {
  if (props.failedChapter) {
    return t('novel.batchPublish.failMessage', { chapter: props.failedChapter });
  }
  return '';
});
</script>

<style lang="scss" scoped>

.batch-fail-overlay {
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

.batch-fail-dialog {
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  width: 500px;
  padding: 18px 36px 24px;
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

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  box-shadow: none;
  padding: 14px 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    line-height: 20px;

    .stat-label {
      color: #f5f5f5;
      font-weight: 700;
    }

    .stat-value {
      font-weight: 800;
      font-size: 16px;

      &.success {
        color: #22C55E;
      }

      &.fail {
        color: #E5484D;
      }

      &.unpublished {
        color: #F59E0B;
      }
    }
  }
}

.fail-message {
  margin-top: 16px;

  span {
    font-size: 14px;
    color: #f5f5f5;
    font-weight: 600;
    line-height: 20px;
  }
}

.action-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 24px;

  .exit-btn {
    min-width: 136px;
    height: 48px;
    background-color: #1a1a1a;
    border: 1px solid #3d3d3d;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    color: #f5f5f5;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }

    &:active {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }
  }

  .retry-btn {
    min-width: 136px;
    height: 48px;
    background-color: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    border: 1px solid #3d3d3d;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    cursor: pointer;
    box-shadow: none;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }

    &:active {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }
  }
}

@keyframes tdIn {
  0% { opacity: 0; transform: scale(.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
