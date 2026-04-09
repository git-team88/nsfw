<template>
  <div v-if="visible" class="novel-modal-overlay">
    <div class="modal-content">
      <img class="close-btn" @click="handleClose" src="@/assets/images/base/close.png" alt="Close" />

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
              {{ t('chapter', { chapter: chapter.chapter }) }} {{ chapter.title }}
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
            <button class="publish-btn" @click="handlePublish">
              {{ t('submit.image.projectView.publishEpisode') }}
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
    return props.project.chapters.filter((chapter: any) => chapter.is_publish === 2);
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
function handlePublish() {
  const chapter = chapters.value.find((c: any) => c.chapter?.toString() === selectedChapter.value);
  if (!chapter || !props.project) return;

  // Format title: 第X章 章节标题「小说名」
  const chapterText = t('chapter', { chapter: chapter.chapter });
  const formattedTitle = `${chapterText} ${chapter.title}「${props.project.name}」`;

  emit('publish', {
    project: props.project,
    episode: chapter.chapter,
    title: formattedTitle,
    content: chapterContent.value,
    chapterIndex: chapter.chapter
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
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  background-color: #FFFFFF;
  border-radius: 1.2rem;
  width: 98rem;
  height: calc(100vh - 26rem);
  max-height: 64rem;
  display: flex;
  flex-direction: column;
}

.close-btn{
  position: absolute;
  right: 1.8rem;
  top: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.modal-body {
  display: flex;
  height: 100%;
  gap: 2rem;
  overflow: hidden;
}

.modal-left{
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  width: 28rem;
  height: 100%;
  padding: 2rem;
  border-radius: 1.2rem 0 0 1.2rem;
  background: #F5F5F5;

  .modal-title{
    font-weight: 500;
    font-size: 1.6rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #364153;
  }
}

.chapter-list {
  flex: 1;
  overflow-y: auto;

  .chapter-item {
    margin-bottom: 1.6rem;
    font-size: 1.4rem;
    color: #6A7282;
    cursor: pointer;

    &:hover {
      color: #364153;
    }

    &.active {
      color: #364153;
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
    padding: 1.6rem 0 2rem;
    font-size: 1.6rem;
    font-weight: 500;
    color: #364153;
  }

  .content-text {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 1.6rem;
    font-size: 1.4rem;
    line-height: 1.8rem;
    color: #364153;
    white-space: pre-wrap;
  }
}

.modal-footer {
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.publish-btn {
  min-width: 30rem;
  height: 5.6rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  background: #FB64B6;
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
</style>
