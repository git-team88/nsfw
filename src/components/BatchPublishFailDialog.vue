<template>
  <div v-if="visible" class="batch-fail-overlay">
    <div class="batch-fail-dialog">
      <img class="close-icon" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />

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

      <div class="fail-message">
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
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.batch-fail-dialog {
  background-color: #ffffff;
  border-radius: 1.2rem;
  width: 50rem;
  padding: 1.8rem 3.6rem 2.4rem;
}

.close-icon {
  position: absolute;
  right: 1.2rem;
  top: 2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.4rem;
  position: relative;

  .dialog-title {
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
    text-align: center;
    line-height: 2.4rem;
  }
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2.4rem;

  .stat-item {
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    line-height: 2rem;

    .stat-label {
      color: #364153;
    }

    .stat-value.success {
      color: #05DF4B;
    }

    .stat-value.fail {
      color: #FA2D47;
    }

    .stat-value.unpublished {
      color: #FBBC05;
    }
  }

  .stat-item + .stat-item {
    margin-left: 4rem;
  }
}

.fail-message {
  width: 42.6rem;
  margin-top: 1.6rem;

  span {
    font-size: 1.4rem;
    color: #364153;
    line-height: 2rem;
  }
}

.action-row {
  display: flex;
  justify-content: center;
  gap: 2.4rem;
  margin-top: 2.4rem;

  .exit-btn {
    width: 13.6rem;
    height: 4.8rem;
    background-color: #F5F5F5;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    color: #6A7282;
    cursor: pointer;

    &:hover {
      color: #FB64B6;
    }
  }

  .retry-btn {
    width: 13.6rem;
    height: 4.8rem;
    background-color: #FB64B6;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.4rem;
    color: #ffffff;
    cursor: pointer;

    &:hover {
      position: relative;
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: inherit;
      }
    }
  }
}
</style>
