<template>
  <div v-if="visible" class="batch-fail-overlay">
    <div class="batch-fail-dialog">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
$ink: #161122;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;

.batch-fail-overlay {
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

.batch-fail-dialog {
  background-color: #ffffff;
  border: 2px solid $ink;
  border-radius: 14px;
  box-shadow: 6px 6px 0 $ink;
  width: 500px;
  padding: 18px 36px 24px;
  position: relative;
  animation: tdIn .3s cubic-bezier(.16,1,.3,1) both;
}

.close-btn {
  background: #fff;
  border: 2.5px solid $ink;
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
  box-shadow: 3px 3px 0 $ink;
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
    color: $ink;
    text-align: center;
    line-height: 24px;
  }
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  background: #FFFBF4;
  border: 2px solid $ink;
  border-radius: 10px;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.08);
  padding: 14px 20px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    line-height: 20px;

    .stat-label {
      color: $ink;
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
    color: $ink;
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
    background-color: #fff;
    border: 2.5px solid $ink;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    color: $ink;
    cursor: pointer;
    box-shadow: 3px 3px 0 $ink;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 $ink;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 $ink;
    }
  }

  .retry-btn {
    min-width: 136px;
    height: 48px;
    background-color: $pink;
    border: 2.5px solid $ink;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    cursor: pointer;
    box-shadow: 3px 3px 0 $ink;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 $ink;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 $ink;
    }
  }
}

@keyframes tdIn {
  0% { opacity: 0; transform: scale(.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
