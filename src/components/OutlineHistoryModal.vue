<template>
  <div v-if="visible" class="outline-history-modal">
    <div class="outline-history-content">
      <div class="outline-history-left">
        <h3 class="outline-history-title">{{ t('novel.outlineHistoryTitle') }}</h3>
        <div v-if="outlineList.length > 0" class="outline-history-list">
          <div
            v-for="(outlineItem, index) in reversedOutlineList"
            :key="index"
            class="outline-history-item"
            :class="{ active: isSameOutline(outlineItem, selectedOutline) }"
            @click="selectOutline(outlineItem)"
          >
            <span class="outline-item-text">{{ getOutlineSummary(outlineItem) }}</span>
          </div>
        </div>
        <div v-else class="outline-history-empty">
          <div class="loading-spinner"></div>
        </div>
      </div>

      <div class="outline-history-right">
        <div class="close-btn-wrapper">
          <button class="close-btn" @click="$emit('cancel')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        </div>

        <div v-if="outlineList.length == 0" class="outline-preview-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ t('home.loading') }}</div>
        </div>

        <div v-else-if="selectedOutline" class="outline-preview-content" ref="previewContentRef">
          <div v-if="selectedOutline.base_info" class="section basic-info">
            <h3 class="section-title">{{ t('novel.basicInfo') }}</h3>
            <div class="info-item">
              <span class="info-label">{{ t('novel.totalChapters') }}</span>
              <span class="info-value">{{ selectedOutline.base_info.total_chapters }}{{ t('novel.chaptersLabel') }}</span>
            </div>
            <div class="info-item" v-if="selectedOutline.base_info.words_per_chapter && selectedOutline.base_info.words_per_chapter.length == 2">
              <span class="info-label">{{ t('novel.wordsPerChapter') }}</span>
              <span class="info-value">{{ selectedOutline.base_info.words_per_chapter[0] }}-{{ selectedOutline.base_info.words_per_chapter[1] }}{{ t('novel.wordsLabel') }}</span>
            </div>
            <div class="info-item" v-if="selectedOutline.base_info.genre">
              <span class="info-label">{{ t('novel.genreLabel') }}</span>
              <span class="info-value">{{ selectedOutline.base_info.genre }}</span>
            </div>
            <div class="info-item" v-if="selectedOutline.base_info.writing_style">
              <span class="info-label">{{ t('novel.writingStyle') }}</span>
              <span class="info-value">{{ selectedOutline.base_info.writing_style }}</span>
            </div>
          </div>

          <div v-if="selectedOutline.story_summary" class="section story-summary">
            <h3 class="section-title">{{ t('novel.storySummary') }}</h3>
            <p class="summary-text">{{ selectedOutline.story_summary.summary }}</p>
          </div>

          <div v-if="selectedOutline.characters && selectedOutline.characters.length > 0" class="section characters">
            <h3 class="section-title">{{ t('novel.characterGallery') }}</h3>
            <div class="characters-list">
              <div v-for="(character, index) in selectedOutline.characters" :key="index" class="character-item">
                <div class="character-name">{{ t('novel.name') }}：{{ character.name }}</div>
                <p class="character-description">{{ character.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedOutline.outline" class="section chapters">
            <h3 class="section-title">{{ t('novel.chapterPlot') }}</h3>
            <div
              v-for="chapter in selectedOutline.outline"
              :key="chapter.chapter"
              class="chapter-card"
            >
              <div class="chapter-title-box">
                <span class="chapter-number">{{ t('novel.chapter', { chapter: chapter.chapter }) }}</span>
                <span class="chapter-title">{{ chapter.title }}</span>
              </div>
              <div class="chapter-desc">{{ chapter.description }}</div>
            </div>
          </div>
        </div>

        <div v-else class="outline-preview-empty">
          <span>{{ t('novel.outlineHistoryEmpty') }}</span>
        </div>

        <div class="outline-history-footer" v-if="outlineList.length > 0">
          <button class="cancel-btn" @click="$emit('cancel')">{{ t('novel.outlineHistoryCancel') }}</button>
          <button class="use-btn" @click="handleUse" :disabled="props.isUsing">{{ t('novel.outlineHistoryUse') }}<div v-if="props.isUsing" class="btn-loading-spinner"></div></button>
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
  outlineList: any[];
  currentOutline: any;
  isUsing?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  select: [outlineObj: any];
}>();

const selectedOutline = ref<any>(null);

const previewContentRef = ref<HTMLElement | null>(null);

function selectOutline(outlineItem: any) {
  selectedOutline.value = outlineItem;
  nextTick(() => {
    if (previewContentRef.value) {
      previewContentRef.value.scrollTop = 0;
    }
  });
}

const reversedOutlineList = computed(() => [...props.outlineList].reverse());

watch(() => props.visible, (newVal) => {
  if (newVal) {
    const currentMatch = props.outlineList.find((item: any) => isSameOutline(item, props.currentOutline));
    selectedOutline.value = currentMatch || (props.outlineList.length > 0 ? props.outlineList[0] : null);
  } else {
    selectedOutline.value = null;
  }
});

watch(() => props.outlineList, (newList) => {
  if (props.visible && newList.length > 0) {
    const currentMatch = newList.find((item: any) => isSameOutline(item, props.currentOutline));
    selectedOutline.value = currentMatch || newList[0];
  }
});

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
  } else {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
      if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
    }
  }
  return true;
}

function isSameOutline(a: any, b: any): boolean {
  if (!a || !b) return false;
  return deepEqual(a, b);
}

function getOutlineSummary(outlineItem: any): string {
  if (!outlineItem) return '';
  if (outlineItem.story_summary?.summary) {
    const firstSentence = outlineItem.story_summary.summary.split(/[。！？\.!?]/)[0] || outlineItem.story_summary.summary;
    return firstSentence;
  }
  if (outlineItem.base_info?.title) return outlineItem.base_info.title;
  if (outlineItem.outline && outlineItem.outline.length > 0) {
    return outlineItem.outline[0].title || '';
  }
  return 'Outline';
}

function handleUse() {
  if (selectedOutline.value) {
    emit('select', selectedOutline.value);
  }
}
</script>

<style scoped lang="scss">
.outline-history-modal {
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

  .outline-history-content {
    position: relative;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 #161122;
    border-radius: 12px;
    width: 980px;
    height: 640px;
    display: flex;
    overflow: hidden;

    .outline-history-left {
      width: 280px;
      height: 640px;
      background: rgba(22, 17, 34, 0.06);
      padding: 20px 5px 20px 20px;
      flex-shrink: 0;

      .outline-history-title {
        font-weight: 600;
        font-size: 16px;
        color: #161122;
        text-align: left;
        margin: 0 0 16px 0;
      }

      .outline-history-list {
        max-height: 560px;
        overflow-y: auto;

        .outline-history-item {
          cursor: pointer;
          margin-bottom: 16px;
          display: flex;

          .outline-item-text {
            font-size: 14px;
            color: #5b5566;
            min-width: 0;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          &.active {
            .outline-item-text {
              color: #FF4D8D;
            }
          }
        }
      }

      .outline-history-empty {
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

    .outline-history-right {
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

        .close-btn {
          background: #fff;
          border: 2.5px solid #161122;
          border-radius: 999px;
          padding: 6px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          box-shadow: 2px 2px 0 #161122;
          transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);

          &:hover { transform: scale(1.1) rotate(90deg); }
        }
      }

      .outline-preview-loading {
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

      .outline-preview-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px 20px 24px;

        .section {
          margin-bottom: 32px;

          &:last-child {
            margin-bottom: 0;
          }

          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #161122;
            margin-bottom: 16px;
          }
        }

        .basic-info {
          margin-top: 18px;
          .info-item {
            display: flex;
            margin-bottom: 12px;

            &:last-child {
              margin-bottom: 0;
            }

            .info-label {
              font-size: 14px;
              color: #161122;
            }

            .info-value {
              font-size: 14px;
              color: #5b5566;
              flex: 1;
            }
          }
        }

        .story-summary {
          .summary-text {
            font-size: 14px;
            line-height: 22px;
            color: #5b5566;
            text-align: justify;
          }
        }

        .characters {
          .characters-list {
            margin-bottom: 24px;

            .character-item {
              margin-bottom: 18px;
              font-size: 14px;
              line-height: 22px;
              color: #161122;

              &:last-child {
                margin-bottom: 0;
              }

              .character-type {
                font-size: 14px;
                color: #9a93a4;
                margin-bottom: 8px;
              }

              .character-name {
                font-size: 14px;
                color: #161122;
              }

              .character-description {
                font-size: 14px;
                line-height: 22px;
                color: #161122;
                text-align: justify;
              }
            }
          }
        }

        .chapters {
          .chapter-card {
            margin-top: 12px;
            font-size: 14px;
            line-height: 30px;
            color: #161122;

            &:nth-of-type(1) {
              margin-top: 0;
            }

            .chapter-title-box {
              display: flex;
              align-items: center;
              gap: 4px;

              .chapter-number {
                font-size: 14px;
              }

              .chapter-title {
                font-size: 14px;
                color: #5b5566;
              }
            }

            .chapter-desc {
              font-size: 14px;
              color: #5b5566;
            }
          }
        }
      }

      .outline-preview-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #9a93a4;
      }

      .outline-history-footer {
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
