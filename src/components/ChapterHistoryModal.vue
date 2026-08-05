<template>
  <div v-if="visible" class="chapter-history-modal">
    <div class="chapter-history-content">
      <div class="chapter-history-left">
        <h3 class="chapter-history-title">{{ t('novel.chapterHistoryTitle') }}</h3>
        <div v-if="chapterList.length > 0" class="chapter-history-list">
          <div
            v-for="(chapterItem, index) in reversedChapterList"
            :key="index"
            class="chapter-history-item"
            :class="{ active: selectedChapter && selectedChapter === chapterItem }"
            @click="selectChapter(chapterItem)"
          >
            <span class="chapter-item-text">{{ getChapterSummary(chapterItem) }}</span>
          </div>
        </div>
        <div v-else class="chapter-history-empty">
          <div class="loading-spinner"></div>
        </div>
      </div>

      <div class="chapter-history-right">
        <div class="close-btn-wrapper">
          <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        </div>

        <div v-if="chapterList.length == 0" class="chapter-preview-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ t('home.loading') }}</div>
        </div>

        <div v-else-if="selectedChapter" class="chapter-preview-content" ref="previewContentRef">
          <div class="chapter-preview-title">{{ t('novel.chapter', { chapter: currentChapter?.chapter }) }}：{{ selectedChapter.title || t('novel.untitled') }}</div>
          <div class="chapter-preview-text">{{ selectedChapter.content || selectedChapter.description || '' }}</div>
        </div>

        <div v-else class="chapter-preview-empty">
          <span>{{ t('novel.chapterHistoryEmpty') }}</span>
        </div>

        <div class="chapter-history-footer" v-if="chapterList.length > 0">
          <button class="cancel-btn" @click="$emit('cancel')">{{ t('novel.chapterHistoryCancel') }}</button>
          <button class="use-btn" @click="handleUse" :disabled="props.isUsing">{{ t('novel.chapterHistoryUse') }}<div v-if="props.isUsing" class="btn-loading-spinner"></div></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  chapterList: any[];
  currentChapter: any;
  isUsing?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  select: [chapterObj: any];
}>();

const selectedChapter = ref<any>(null);

const previewContentRef = ref<HTMLElement | null>(null);

const reversedChapterList = computed(() => [...props.chapterList].reverse());

const isCurrentChapter = (chapterItem: any): boolean => {
  if (!props.currentChapter) return false;
  return chapterItem.title == props.currentChapter.title && chapterItem.content == props.currentChapter.content;
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    const currentMatch = props.chapterList.find((item: any) => isCurrentChapter(item));
    selectedChapter.value = currentMatch || (props.chapterList.length > 0 ? props.chapterList[0] : null);
  } else {
    selectedChapter.value = null;
  }
});

watch(() => props.chapterList, (newList) => {
  if (props.visible && newList.length > 0) {
    const currentMatch = newList.find((item: any) => isCurrentChapter(item));
    selectedChapter.value = currentMatch || newList[0];
  }
});

function selectChapter(chapterItem: any) {
  selectedChapter.value = chapterItem;
  nextTick(() => {
    if (previewContentRef.value) {
      previewContentRef.value.scrollTop = 0;
    }
  });
}

function getChapterSummary(chapterItem: any): string {
  if (!chapterItem) return '';
  if (chapterItem.content) {
    const firstParagraph = chapterItem.content.split('\n\n').find((p: string) => p.trim());
    return firstParagraph?.trim() || '';
  }
  return chapterItem.title || t('novel.untitled');
}

function handleUse() {
  if (selectedChapter.value) {
    emit('select', selectedChapter.value);
  }
}
</script>

<style scoped lang="scss">
.chapter-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .chapter-history-content {
    position: relative;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 #161122;
    border-radius: 12px;
    width: 980px;
    height: 640px;
    display: flex;
    overflow: hidden;

    .chapter-history-left {
      width: 280px;
      height: 640px;
      background: rgba(22, 17, 34, 0.06);
      padding: 20px 5px 20px 20px;
      flex-shrink: 0;

      .chapter-history-title {
        font-weight: 600;
        font-size: 16px;
        color: #161122;
        text-align: left;
        margin: 0 0 16px 0;
      }

      .chapter-history-list {
        max-height: 560px;
        overflow-y: auto;

        .chapter-history-item {
          cursor: pointer;
          margin-bottom: 16px;
          display: flex;

          .chapter-item-text {
            min-width: 0;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-size: 14px;
            color: #5b5566;
          }

          &.active {
            .chapter-item-text {
              color: #FF4D8D;
            }
          }
        }
      }

      .chapter-history-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(22, 17, 34, 0.12);
          border-top: 3px solid #5b5566;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }
    }

    .chapter-history-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;

      .close-btn-wrapper {
        width: 100%;
        height: 60px;
        padding: 0 20px 0 0;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        z-index: 10;
        cursor: pointer;

        .close-btn {
          position: absolute;
          right: 14px;
          top: 14px;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #fff;
          border: 2px solid #161122;
          box-shadow: 2px 2px 0 #161122;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 6px;
          transition: transform .2s;

          &:hover { transform: scale(1.1) rotate(90deg); }
        }
      }

      .chapter-preview-loading {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 10px;

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(22, 17, 34, 0.12);
          border-top: 3px solid #5b5566;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          font-size: 14px;
          color: #5b5566;
        }
      }

      .chapter-preview-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px 20px 24px;

        .chapter-preview-title {
          font-size: 28px;
          font-weight: 600;
          color: #161122;
          text-align: center;
          margin-bottom: 16px;
        }

        .chapter-preview-text {
          font-size: 16px;
          color: #161122;
          line-height: 32px;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }

      .chapter-preview-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #9a93a4;
      }

      .chapter-history-footer {
        flex-shrink: 0;
        padding: 20px 35px;
        display: flex;
        gap: 30px;
        border-top: 1px solid rgba(22, 17, 34, 0.12);

        .cancel-btn {
          flex: 1;
          height: 48px;
          border: 3px solid #161122;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          background: rgba(22, 17, 34, 0.06);
          color: #5b5566;
          box-shadow: 3px 3px 0 #161122;

          &:hover {
            color: #FF4D8D;
            box-shadow: 4px 4px 0 #161122;
            transform: translateY(-1px);
          }
        }

        .use-btn {
          flex: 1;
          height: 48px;
          border: 3px solid #161122;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          background: #FF4D8D;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 3px 3px 0 #161122;

          &:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .btn-loading-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

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
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
}
</style>
