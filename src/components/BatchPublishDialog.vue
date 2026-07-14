<template>
  <div v-if="visible" class="batch-publish-overlay">
    <div class="batch-publish-dialog">
      <div class="dialog-header">
        <span class="dialog-title">{{ t('novel.batchPublish.selectChapters') }}</span>
        <img class="dialog-close-icon" src="@/assets/images/base/close.png" alt="" @click="$emit('close')" />
      </div>

      <div class="dialog-body">
        <div class="unpublished-section">
          <div class="unpublished-header">
            <span class="unpublished-label">{{ t('novel.batchPublish.unpublished') }}</span>
            <div class="select-all-btn" @click="toggleSelectAll">
              <span class="select-all-text">{{ t('novel.batchPublish.selectAll', { count: unpublishedChapters.length }) }}</span>
              <img
                class="checkbox-icon"
                :src="isAllSelected ? checkActive : checkInactive"
                alt=""
              />
            </div>
          </div>

          <div class="unpublished-list">
            <div
              v-for="chapter in unpublishedChapters"
              :key="chapter.chapter"
              class="chapter-row"
              @click="toggleChapter(chapter.chapter)"
            >
              <span class="chapter-name">{{ t('novel.chapter', { chapter: chapter.chapter }) }}&nbsp;{{ chapter.title }}</span>
              <div class="chapter-right">
                <span class="chapter-status-unpublish">{{ t('novel.batchPublish.unpublished') }}</span>
                <img
                  class="checkbox-icon"
                  :src="selectedChapters.includes(chapter.chapter) ? checkActive : checkInactive"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="publishedChapters.length > 0" class="published-section">
          <div class="published-header">
            <span class="published-label">{{ t('novel.batchPublish.published') }}</span>
            <span class="published-count">{{ t('novel.batchPublish.publishedCount', { count: publishedChapters.length }) }}</span>
          </div>

          <div class="published-list">
            <div
              v-for="chapter in publishedChapters"
              :key="chapter.chapter"
              class="chapter-row-published"
            >
              <span class="chapter-name">{{ t('novel.chapter', { chapter: chapter.chapter }) }}&nbsp;{{ chapter.title }}</span>
              <span class="chapter-status-published">{{ t('novel.published') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button
          class="next-step-btn"
          :class="{ disabled: selectedChapters.length === 0 }"
          :disabled="selectedChapters.length === 0"
          @click="handleNextStep"
        >
          <span class="next-step-text">{{ t('novel.batchPublish.nextStep') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import checkActive from '@/assets/images/register/check_active.png';
import checkInactive from '@/assets/images/register/check.png';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  chapters: any[];
}>();

const emit = defineEmits<{
  close: [];
  confirm: [chapters: any[]];
}>();

const selectedChapters = ref<number[]>([]);

const unpublishedChapters = computed(() =>
  props.chapters.filter(c => c.is_publish == 2)
);

const publishedChapters = computed(() =>
  props.chapters.filter(c => c.is_publish == 1)
);

const isAllSelected = computed(() =>
  unpublishedChapters.value.length > 0 &&
  selectedChapters.value.length === unpublishedChapters.value.length
);

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedChapters.value = [];
  } else {
    selectedChapters.value = unpublishedChapters.value.map(c => c.chapter);
  }
};

const toggleChapter = (chapterNum: number) => {
  const idx = selectedChapters.value.indexOf(chapterNum);
  if (idx === -1) {
    selectedChapters.value.push(chapterNum);
  } else {
    selectedChapters.value.splice(idx, 1);
  }
};

const handleNextStep = () => {
  if (selectedChapters.value.length === 0) return;
  const selected = props.chapters.filter(c => selectedChapters.value.includes(c.chapter));
  emit('confirm', selected);
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedChapters.value = [];
  }
});
</script>

<style lang="scss" scoped>
.batch-publish-overlay {
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

.batch-publish-dialog {
  background-color: #ffffff;
  border-radius: 1.2rem;
  position: relative;
  width: 50rem;
  max-height: 59.6rem;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  position: relative;
  padding: 1.8rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .dialog-title {
    color: #364153;
    font-size: 1.6rem;
    font-weight: 500;
    line-height: 2.4rem;
  }
}

.dialog-close-icon {
  position: absolute;
  top: 2rem;
  right: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 3.6rem;
}

.unpublished-section {
  .unpublished-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.2rem;

    .unpublished-label {
      color: #364153;
      font-size: 1.4rem;
      line-height: 2.2rem;
    }

    .select-all-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;

      .select-all-text {
        color: #99A1AF;
        font-size: 1.4rem;
        line-height: 2rem;
      }

      .checkbox-icon {
        width: 2.4rem;
        height: 2.4rem;
      }
    }
  }

  .unpublished-list {
    background-color: #F5F5F5;
    border-radius: 0.8rem;
    max-height: 23rem;
    overflow-y: auto;
    padding: 1.2rem;
    margin: 1rem 0 0;

    .chapter-row {
      margin-bottom: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;

      &:last-child {
        margin-bottom: 0;
      }

      .chapter-name {
        flex: 1;
        color: #364153;
        font-size: 1.4rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chapter-right {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .chapter-status-unpublish {
        color: #99A1AF;
        font-size: 1.4rem;
      }

      .checkbox-icon {
        width: 2.4rem;
        height: 2.4rem;
      }
    }
  }
}

.published-section {
  margin-top: 1.2rem;

  .published-header {
    display: flex;
    align-items: center;
    padding: 0 1.2rem;

    .published-label {
      color: #364153;
      font-size: 1.4rem;
    }

    .published-count {
      color: #99A1AF;
      font-size: 1.4rem;
      line-height: 2rem;
    }
  }

  .published-list {
    background-color: #F5F5F5;
    border-radius: 0.8rem;
    max-height: 22.4rem;
    overflow-y: auto;
    padding: 1.2rem;
    margin: 1rem 0 0;

    .chapter-row-published {
      margin-bottom: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &:last-child {
        margin-bottom: 0;
      }

      .chapter-name {
        flex: 1;
        color: #364153;
        font-size: 1.4rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chapter-status-published {
        color: #6A7282;
        font-size: 1.4rem;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding: 2.4rem 0;
  flex-shrink: 0;

  .next-step-btn {
    background-color: #FB64B6;
    border-radius: 0.8rem;
    height: 4.8rem;
    min-width: 13.6rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(.disabled) {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    &.disabled {
      background: rgba(251, 100, 182, 0.5);
      cursor: not-allowed;
    }

    .next-step-text {
      color: #ffffff;
      font-size: 1.4rem;
      line-height: 2rem;
    }
  }
}
</style>
