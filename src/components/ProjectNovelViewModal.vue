<template>
  <div v-if="visible" class="novel-modal-overlay">
    <div class="modal-content">
      <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
              class="publish-btn"
              :class="{ 'published': isChapterPublished }"
              @click="handlePublish"
              :disabled="isChapterPublished"
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
import { ref, computed, watch, onMounted } from 'vue';
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

const emit = defineEmits(['close', 'publish']);

// Chapter selection
const selectedChapter = ref('1');
const loading = ref(false);
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
  try {
    // Get session_id from project data
    const sessionId = props.project.session_id;
    if (!sessionId) {
      chapterContent.value = t('submit.image.noChapterContent');
      return;
    }

    // Call API to fetch chapter details (using 1-based indexing)
    const res = await api.detailChapter(sessionId, parseInt(chapterNumber)) as any;
    if (res.code === 200) {
      const result = res.data;
      if (result && result.content) {
        chapterContent.value = result.content;
      } else {
        chapterContent.value = t('submit.image.noChapterContent');
      }
    } else {
      chapterContent.value = t('submit.image.noChapterContent');
    }
  } catch (error) {
    console.error('Error fetching chapter details:', error);
    chapterContent.value = t('submit.image.noChapterContent');
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
    content: chapterContent.value,
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
  background-color: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #FFFFFF;
  border-radius: 14px;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  width: 980px;
  height: calc(100vh - 260px);
  max-height: 640px;
  display: flex;
  flex-direction: column;
}

.close-btn{
  background: none;
  border: none;
  padding: 0;
  position: absolute;
  right: 18px;
  top: 18px;
  width: 20px;
  height: 20px;
  cursor: pointer;
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
  width: 280px;
  height: 100%;
  padding: 20px;
  border-radius: 14px 0 0 14px;
  background: #FFEFF5;
  border-right: 2px solid #161122;

  .modal-title{
    font-weight: 800;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #161122;
  }
}

.chapter-list {
  flex: 1;
  overflow-y: auto;

  .chapter-item {
    margin-bottom: 16px;
    font-size: 14px;
    color: #161122;
    opacity: 0.65;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      color: #161122;
      opacity: 1;
    }

    &.active {
      color: #161122;
      opacity: 1;
    }

    .chapter-info {
      flex: 1;
    }

    .chapter-status {
      color: #161122;
      opacity: 0.4;
      font-size: 12px;
      margin-left: 10px;
    }
  }
}

.modal-right{
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
    color: #161122;
  }

  .content-text {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 16px;
    font-size: 14px;
    font-weight: 700;
    line-height: 18px;
    color: #161122;
    white-space: pre-wrap;
  }
}

.modal-footer {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.publish-btn {
  min-width: 300px;
  height: 56px;
  border: 2px solid #161122;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF4D8D, #FF7A45);
  color: #ffffff;
  cursor: pointer;
  box-shadow: 2px 2px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 3px 3px 0 #161122;
  }

  &.published {
    background: rgba(255, 77, 142, 0.4);
    color: #161122;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: 2px 2px 0 #161122;
    }
  }
}
</style>
