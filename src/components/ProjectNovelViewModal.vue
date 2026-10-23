<template>
  <div v-if="visible" class="novel-modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

      <div class="modal-body">
        <div class="modal-left">
          <div class="modal-title">{{ project?.name }}</div>

          <div class="chapter-list">
            <div
              v-for="chapter in chapters"
              :key="chapter.chapter || chapter.id"
              class="chapter-item"
              :class="{ active: selectedChapter === chapter.chapter?.toString() }"
              @click="selectChapter(chapter.chapter?.toString())"
            >
              <span class="chapter-info">{{ t('chapter', { chapter: chapter.chapter }) }} {{ chapter.title }}</span>
              <span v-if="chapter.is_publish === 1" class="chapter-status">{{ t('submit.image.published') }}</span>
            </div>
          </div>
        </div>

        <div class="modal-right">
          <div class="content-area">
            <div class="content-title">{{ currentChapterTitle }}</div>
            <div class="content-text" v-if="loading">{{ t('loading') }}</div>
            <div class="content-text" v-else>{{ currentChapterContent }}</div>
          </div>

          <div class="modal-footer">
            <button
              v-if="unpublishedChaptersCount > 2"
              class="batch-publish-btn"
              :class="{ 'published': isBatchPublishing }"
              :disabled="isBatchPublishing"
              @click="handleBatchPublish"
            >
              {{ t('novel.batchPublish.batchPublishAll') }}
            </button>
            <button
              class="publish-btn"
              :class="{ 'published': isChapterPublished }"
              @click="handlePublish"
              :disabled="isChapterPublished || loading || !chapterContentLoaded"
            >
              {{ isChapterPublished ? t('submit.image.published') : t('submit.image.projectView.publishChapter') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { trackClickPublishButton } from '@/utils/analytics';
const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'publish', 'batchPublish']);

const unpublishedChaptersCount = computed(() =>
  chapters.value.filter((c: any) => c.is_publish !== 1).length
);

// Chapter selection
const selectedChapter = ref('1');
const loading = ref(false);
const isBatchPublishing = ref(false);
const chapterResultAsync = ref<any>(null);
// 正文是否真的拿到了：没拿到时页面显示的是「暂无章节内容」提示，不能当正文发出去
const chapterContentLoaded = ref(false);
const chapterContent = ref('');

// Get chapters from project
const chapters = computed(() => {
  if (!props.project) return [];

  if (props.project.chapters && props.project.chapters.length > 0) {
    // Show all chapters, not just unpublished ones
    return props.project.chapters.sort((a: any, b: any) => a.chapter - b.chapter);
  }

  // Priority 2: Use project outline from result_async
  const stepStatus = props.project.step_status;
  const stepChapterIndex = props.project.step_chapter_index;
  const outline = props.project.result_async?.generate_novel_outline?.outline || [];

  // If step_status is SUCCESS, show chapters up to step_chapter_index
  if (stepStatus == 'SUCCESS' && stepChapterIndex) {
    return outline.slice(0, stepChapterIndex);
  }

  return outline;
});

// Current chapter title
const currentChapterTitle = computed(() => {
  const chapter = chapters.value.find((c: any) => c.chapter?.toString() === selectedChapter.value);
  if (!chapter) return '';
  return `${t('chapter', { chapter: chapter.chapter })} ${chapter.title}`;
});

// Current chapter content
const currentChapterContent = computed(() => {
  return chapterContent.value || '';
});

// Check if selected chapter is published
const isChapterPublished = computed(() => {
  const chapter = chapters.value.find((c: any) => c.chapter?.toString() === selectedChapter.value);
  return chapter?.is_publish === 1;
});

// Fetch chapter details
async function fetchChapterDetails(chapterNumber: string) {
  if (!props.project) return;

  loading.value = true;
  chapterContentLoaded.value = false;
  try {
    // Get session_id from project data
    const sessionId = props.project.session_id;
    if (!sessionId) {
      chapterContent.value = t('submit.image.noChapterContent');
      chapterContentLoaded.value = false;
      return;
    }

    // Call API to fetch chapter details (using 1-based indexing)
    const res = await api.detailChapter(sessionId, parseInt(chapterNumber)) as any;
    if (res.code === 200) {
      const result = res.data;
      if (result && result.content) {
        chapterContent.value = result.content;
        chapterContentLoaded.value = true;
        // 插图列表（[[img_placeholder]] 对应的图）跟正文一起交给发布页
        chapterResultAsync.value = result.result_async ?? null;
      } else {
        chapterContent.value = t('submit.image.noChapterContent');
        chapterContentLoaded.value = false;
      }
    } else {
      chapterContent.value = t('submit.image.noChapterContent');
      chapterContentLoaded.value = false;
    }
  } catch (error) {
    console.error('Error fetching chapter details:', error);
    chapterContent.value = t('submit.image.noChapterContent');
    chapterContentLoaded.value = false;
  } finally {
    loading.value = false;
  }
}

// Select chapter
function selectChapter(chapter: string) {
  selectedChapter.value = chapter;
  fetchChapterDetails(chapter);
}

// Handle close
function handleClose() {
  emit('close');
}

// Handle batch publish - close modal and go directly to batch publish page
function handleBatchPublish() {
  if (isBatchPublishing.value) return;
  isBatchPublishing.value = true;
  emit('close');
  emit('batchPublish');
}

// Handle overlay click
function handleOverlayClick() {
  emit('close');
}

// Handle publish
async function handlePublish() {
  trackClickPublishButton(3);
  const chapter = chapters.value.find((c: any) => c.chapter?.toString() === selectedChapter.value);
  if (!chapter || !props.project) return;

  // Check if chapter is already published via API
  const sessionId = props.project.session_id;
  if (sessionId && chapter.chapter) {
    try {
      const chapterRes = await api.detailChapter(sessionId, chapter.chapter) as any;
      if (chapterRes.code === 200 && chapterRes.data && chapterRes.data.is_publish === 1) {
        toast(t('submit.image.episodeNotUnpublished'));
        setTimeout(() => { location.reload(); }, 1000);
        return;
      }
    } catch (error) {
      console.error('Error checking chapter publish status:', error);
    }
  }

  // Format title: 第X章 章节标题 (不带书名)
  const chapterText = t('chapter', { chapter: chapter.chapter });
  const formattedTitle = `${chapterText} ${chapter.title}`;

  // Get cover from project (合集封面)
  const cover = props.project.cover || props.project.result_async?.generate_novel_cover;

  emit('publish', {
    project: props.project,
    episode: chapter.chapter,
    title: formattedTitle,
    content: chapterContentLoaded.value ? chapterContent.value : '',
    result_async: chapterResultAsync.value,
    cover: cover,
    chapterIndex: chapter.chapter,
    session_id: props.project.session_id
  });
}

// Watch for project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    // Select the first chapter's chapter number
    const firstChapter = chapters.value[0];
    if (firstChapter && firstChapter.chapter) {
      selectedChapter.value = firstChapter.chapter.toString();
      fetchChapterDetails(firstChapter.chapter.toString());
    } else {
      selectedChapter.value = '1';
      fetchChapterDetails('1');
    }
  }
}, { immediate: true });


</script>

<style lang="scss" scoped>
.novel-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #1a1a1a;
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  width: 980px;
  // 窗口比 980 窄时跟着缩，不要被裁掉
  max-width: calc(100vw - 32px);
  height: calc(100vh - 260px);
  max-height: 640px;
  display: flex;
  flex-direction: column;
}

.close-btn{
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
  padding: 6px;
  position: absolute;
  right: 18px;
  top: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }
}

.modal-body {
  display: flex;
  height: 100%;
  gap: 20px;
  overflow: hidden;
}

.modal-left{
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 0 0 280px;
  width: 280px;
  max-width: 36%;
  min-width: 0;
  height: 100%;
  padding: 20px;
  border-radius: 14px 0 0 14px;
  background: rgba(255,79,154,0.08);
  border-right: 1px solid #3d3d3d;

  .modal-title{
    font-weight: 800;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #f5f5f5;
  }
}

.chapter-list {
  flex: 1;
  overflow-y: auto;

  .chapter-item {
    margin-bottom: 16px;
    font-size: 14px;
    color: #f5f5f5;
    opacity: 0.65;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      color: #f5f5f5;
      opacity: 1;
    }

    &.active {
      color: #f5f5f5;
      opacity: 1;
    }

    .chapter-info {
      flex: 1;
    }

    .chapter-status {
      color: #f5f5f5;
      opacity: 0.4;
      font-size: 12px;
      margin-left: 10px;
    }
  }
}

.modal-right{
  min-width: 0;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .content-title {
    padding: 16px 0 20px;
    font-size: 16px;
    font-weight: 800;
    color: #f5f5f5;
  }

  .content-text {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 16px;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    color: #f5f5f5;
    white-space: pre-wrap;
  }
}

.modal-footer {
  padding: 20px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

// 「批量发布全部待发」和「发布本章」同一套样式。
// 发布页 Novel.scss 里有不带 scoped 的 `.publish-btn { height: 48px }` 会漏进弹窗，这里用 .modal-footer 加权压过它
.modal-footer .batch-publish-btn,
.modal-footer .publish-btn {
  // 两个按钮等宽平分，最宽 300；窗口窄时一起缩，不会把弹窗撑出去
  flex: 1 1 0;
  min-width: 0;
  max-width: 300px;
  height: 48px;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(145deg, #ff74b3, #f73382);
  color: #f5f5f5;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    box-shadow: none;
  }

  &.published {
    background: rgba(255,79,154,0.15);
    color: #f5f5f5;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}
</style>
