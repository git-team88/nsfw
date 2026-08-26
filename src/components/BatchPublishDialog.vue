<template>
  <div v-if="visible" class="batch-publish-overlay">
    <div class="batch-publish-dialog">
      <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="dialog-header">
        <span class="dialog-title">{{ t('novel.batchPublish.selectChapters') }}</span>
      </div>

      <div class="dialog-body">
        <div class="unpublished-section">
          <div class="unpublished-header">
            <span class="unpublished-label">{{ t('novel.batchPublish.unpublished') }}</span>
            <div class="select-all-btn" @click="toggleSelectAll">
              <span class="select-all-text">{{ t('novel.batchPublish.selectAll', { count: unpublishedChapters.length }) }}</span>
              <div class="checkbox" :class="{ active: isAllSelected }">
                <svg v-if="isAllSelected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
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
                <div class="checkbox" :class="{ active: selectedChapters.includes(chapter.chapter) }">
                  <svg v-if="selectedChapters.includes(chapter.chapter)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
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
          :class="{ disabled: selectedChapters.length === 0 || isNextStepLoading }"
          :disabled="selectedChapters.length === 0 || isNextStepLoading"
          @click="handleNextStep"
        >
          <span class="next-step-text">{{ t('novel.batchPublish.nextStep') }}</span>
          <span v-if="isNextStepLoading" class="btn-spinner"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  chapters: any[];
  sessionId: string;
  checkOwnership: () => boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [chapters: any[]];
  refresh: [chapters: any[]];
}>();

const selectedChapters = ref<number[]>([]);
const isNextStepLoading = ref<boolean>(false);

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

const handleNextStep = async () => {
  if (selectedChapters.value.length === 0) return;
  if (props.checkOwnership()) return;

  isNextStepLoading.value = true;
  try {
    const res = await api.detailProject(props.sessionId) as any;
    if (res.code === 200 && res.data?.chapters) {
      emit('refresh', res.data.chapters);

      const freshChapters = res.data.chapters;
      const alreadyPublished = selectedChapters.value.filter(chapterNum => {
        const freshChapter = freshChapters.find((c: any) => c.chapter === chapterNum);
        return freshChapter && freshChapter.is_publish == 1;
      });

      if (alreadyPublished.length > 0) {
        toast(t('novel.batchPublish.someAlreadyPublished', { count: alreadyPublished.length }));
        isNextStepLoading.value = false;
        emit('close');
        return;
      }
    }
  } catch (e) {
    console.error('Failed to refresh chapters before next step:', e);
  } finally {
    isNextStepLoading.value = false;
  }

  const selected = props.chapters.filter(c => selectedChapters.value.includes(c.chapter));
  emit('confirm', selected);
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 打开弹窗时默认全选未发布的章节
    selectedChapters.value = unpublishedChapters.value.map(c => c.chapter);
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
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.batch-publish-dialog {
  background-color: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  position: relative;
  width: 500px;
  max-height: 596px;
  display: flex;
  flex-direction: column;
  animation: tdIn .3s cubic-bezier(.16,1,.3,1) both;
}

.close-btn {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 50%;
  padding: 0;
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
  transition: transform .2s;
  cursor: pointer;
  z-index: 10;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.dialog-header {
  position: relative;
  padding: 18px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .dialog-title {
    color: #f5f5f5;
    font-size: 16px;
    font-weight: 800;
    line-height: 24px;
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 36px;
}

.checkbox {
  width: 22px;
  height: 22px;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.14s ease;

  &.active {
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    border-color: #f5f5f5;
    box-shadow: none;
  }
}

.unpublished-section {
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  background-color: #1a1a1a;
  padding: 12px;

  .unpublished-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    margin-bottom: 10px;

    .unpublished-label {
      color: #f5f5f5;
      font-size: 14px;
      font-weight: 700;
      line-height: 22px;
    }

    .select-all-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;

      .select-all-text {
        color: #777;
        font-size: 14px;
        line-height: 20px;
      }
    }
  }

  .unpublished-list {
    max-height: 230px;
    overflow-y: auto;

    .chapter-row {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 8px 10px;
      background: #1a1a1a;
      border: 1.5px solid #2c2c2c;
      border-radius: 8px;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &:hover {
        box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .chapter-name {
        flex: 1;
        color: #f5f5f5;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chapter-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chapter-status-unpublish {
        color: #777;
        font-size: 13px;
        font-weight: 600;
      }
    }
  }
}

.published-section {
  margin-top: 16px;

  .published-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;

    .published-label {
      color: #f5f5f5;
      font-size: 14px;
      font-weight: 700;
    }

    .published-count {
      color: #777;
      font-size: 14px;
      line-height: 20px;
    }
  }

  .published-list {
    background-color: #1a1a1a;
    border: 2px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    max-height: 224px;
    overflow-y: auto;
    padding: 12px;
    margin: 10px 0 0;

    .chapter-row-published {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: #1a1a1a;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .chapter-name {
        flex: 1;
        color: #f5f5f5;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chapter-status-published {
        color: #aaa;
        font-size: 13px;
        font-weight: 600;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  flex-shrink: 0;

  .next-step-btn {
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    border: 1px solid #3d3d3d
    border: 1px solid #ff9aca;
    border-radius: 13px;
    height: 48px;
    min-width: 136px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 800;
    box-shadow: none;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover:not(.disabled) {
      box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
    }

    &:active:not(.disabled) {
      box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
    }

    &.disabled {
      background: rgba(255,79,154,0.5);
      cursor: not-allowed;
      box-shadow: none;
    }

    .next-step-text {
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      line-height: 20px;
    }

    .btn-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #FFFFFF;
      border-right-color: transparent;
      border-radius: 50%;
      animation: btn-spin 0.6s linear infinite;
      flex-shrink: 0;
    }
  }
}

@keyframes btn-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes tdIn {
  0% { opacity: 0; transform: scale(.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
