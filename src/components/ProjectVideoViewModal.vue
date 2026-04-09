<template>
  <div v-if="visible" class="comic-modal-overlay">
    <div class="view-modal">
      <div class="modal-content">
        <img class="close-btn" @click="handleClose" src="@/assets/images/base/close.png" alt="Close" />

        <!-- 左侧部分 -->
        <div class="left-section">
          <div class="project-name">{{ project?.name }}</div>
          <img :src="project?.cover" alt="Project cover" class="project-cover" />
          <button class="publish-btn" @click="handlePublish">{{ t('submit.video.projectView.publishEpisode') }}</button>
        </div>

        <!-- 右侧部分 -->
        <div class="right-section">
          <div class="right-header">
            <span class="detail-title">{{ t('submit.video.projectView.detail') }}</span>
            <div class="episode-nav">
              <button v-if="currentPage > 1" class="nav-btn prev" @click="prevPage">
                <img src="@/assets/images/publish/prev.png" alt="Previous" />
              </button>
              <div class="episode-tabs">
                <button
                  v-for="episode in visibleEpisodes"
                  :key="episode"
                  class="episode-tab"
                  :class="{ active: selectedEpisode == episode }"
                  @click="selectEpisode(episode.toString())"
                >{{ episode }}</button>
              </div>
              <button v-if="currentPage < totalPages" class="nav-btn next" @click="nextPage">
                <img src="@/assets/images/publish/next.png" alt="Next" />
              </button>
            </div>
          </div>

          <div class="right-body">
            <div class="episode-title">{{ currentEpisodeTitle }}</div>
            <div class="video-player" v-if="currentVideoUrl">
              <video
                ref="videoPlayer"
                :src="currentVideoUrl"
                controls
                class="video-element"
              ></video>
            </div>
            <div class="video-loading" v-else-if="loading">
              {{ t('loading') }}
            </div>
            <div class="video-empty" v-else>
              {{ t('submit.video.noVideoContent') }}
            </div>
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

// Episode selection
const selectedEpisode = ref('1');
const currentPage = ref(1);
const episodesPerPage = 10;
const loading = ref(false);
const currentVideoUrl = ref('');
const videoPlayer = ref<HTMLVideoElement | null>(null);

// Get episodes from project outline
const episodes = computed(() => {
  if (!props.project) return [];

  // 优先使用 project.chapters 并过滤出未发布的章节
  if (props.project.chapters) {
    return props.project.chapters
      .filter((chapter: any) => chapter.is_publish === 2)
      .sort((a: any, b: any) => a.chapter - b.chapter);
  }

  // Check if project has the required fields
  const stepStatus = props.project.step_status;
  const stepChapterIndex = props.project.step_chapter_index;
  const outline = props.project.result_async?.generate_video_outline?.outline || [];

  // If step_status is SUCCESS, show episodes up to step_chapter_index
  if (stepStatus === 'SUCCESS' && stepChapterIndex) {
    return outline.slice(0, stepChapterIndex);
  }

  return outline;
});

// Calculate total episodes
const totalEpisodes = computed(() => {
  return episodes.value.length || 1;
});

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(totalEpisodes.value / episodesPerPage);
});

// Calculate visible episodes for current page
const visibleEpisodes = computed(() => {
  if (props.project?.chapters) {
    // 过滤出未发布的章节并按 chapter 排序
    const unpublishedChapters = props.project.chapters
      .filter((chapter: any) => chapter.is_publish === 2)
      .sort((a: any, b: any) => a.chapter - b.chapter);
    
    // 计算当前页的章节
    const start = (currentPage.value - 1) * episodesPerPage;
    const end = start + episodesPerPage;
    return unpublishedChapters.slice(start, end).map((chapter: any) => chapter.chapter);
  } else {
    // 原逻辑作为备用
    const start = (currentPage.value - 1) * episodesPerPage + 1;
    const end = Math.min(start + episodesPerPage - 1, totalEpisodes.value);
    const episodes = [];
    for (let i = start; i <= end; i++) {
      episodes.push(i);
    }
    return episodes;
  }
});

// Current episode title
const currentEpisodeTitle = computed(() => {
  const episode = episodes.value.find((e: any) => e.chapter?.toString() === selectedEpisode.value);
  if (!episode) return '';
  return `${t('submit.video.episode', { episode: episode.chapter })} ${episode.title}`;
});

// Previous page
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// Next page
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

// Fetch episode details
async function fetchEpisodeDetails(episodeNumber: string) {
  if (!props.project) return;

  loading.value = true;
  try {
    // Get session_id from project data
    const sessionId = props.project.session_id;
    if (!sessionId) {
      currentVideoUrl.value = '';
      return;
    }

    // Call API to fetch episode details
    const res = await api.detailChapter(sessionId, parseInt(episodeNumber)) as any;
    if (res.code === 200) {
      const result = res.data;
      if (result && result.video_url) {
        currentVideoUrl.value = result.video_url;
      } else {
        currentVideoUrl.value = '';
      }
    } else {
      currentVideoUrl.value = '';
    }
  } catch (error) {
    console.error('Error fetching episode details:', error);
    currentVideoUrl.value = '';
  } finally {
    loading.value = false;
  }
}

// Select episode
function selectEpisode(episode: string) {
  selectedEpisode.value = episode;
  fetchEpisodeDetails(episode);
}

// Handle close
function handleClose() {
  // Stop video playback when closing
  if (videoPlayer.value) {
    videoPlayer.value.pause();
  }
  emit('close');
}

// Handle overlay click
function handleOverlayClick() {
  handleClose();
}

// Handle publish
function handlePublish() {
  emit('publish', props.project, parseInt(selectedEpisode.value));
}

// Watch for project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    if (newProject.chapters) {
      // 过滤出未发布的章节并按 chapter 排序
      const unpublishedChapters = newProject.chapters
        .filter((chapter: any) => chapter.is_publish === 2)
        .sort((a: any, b: any) => a.chapter - b.chapter);
      
      if (unpublishedChapters.length > 0) {
        selectedEpisode.value = unpublishedChapters[0].chapter.toString();
        fetchEpisodeDetails(unpublishedChapters[0].chapter.toString());
        return;
      }
    }
    // 原逻辑作为备用
    selectedEpisode.value = '1';
    fetchEpisodeDetails('1');
  }
}, { immediate: true });

// Fetch first episode when modal is shown
watch(() => props.visible, (isVisible) => {
  if (isVisible && props.project) {
    if (props.project.chapters) {
      // 过滤出未发布的章节并按 chapter 排序
      const unpublishedChapters = props.project.chapters
        .filter((chapter: any) => chapter.is_publish === 2)
        .sort((a: any, b: any) => a.chapter - b.chapter);
      
      if (unpublishedChapters.length > 0) {
        selectedEpisode.value = unpublishedChapters[0].chapter.toString();
        fetchEpisodeDetails(unpublishedChapters[0].chapter.toString());
        return;
      }
    }
    // 原逻辑作为备用
    fetchEpisodeDetails('1');
  }
});

onMounted(() => {
  if (props.project) {
    if (props.project.chapters) {
      // 过滤出未发布的章节并按 chapter 排序
      const unpublishedChapters = props.project.chapters
        .filter((chapter: any) => chapter.is_publish === 2)
        .sort((a: any, b: any) => a.chapter - b.chapter);
      
      if (unpublishedChapters.length > 0) {
        selectedEpisode.value = unpublishedChapters[0].chapter.toString();
        fetchEpisodeDetails(unpublishedChapters[0].chapter.toString());
        return;
      }
    }
    // 原逻辑作为备用
    fetchEpisodeDetails('1');
  }
});
</script>

<style lang="scss" scoped>
.comic-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.view-modal {
  position: relative;
  width: 98rem;
  height: calc(100vh - 34rem);
  max-height: 56rem;
  background: #FFFFFF;
  border-radius: 1.2rem;
  overflow: hidden;
}

.modal-content {
  display: flex;
  height: 56rem;
  min-height: calc(100vh - 34rem);
}

/* 左侧部分 */
.left-section {
  width: 37.2rem;
  height: 100%;
  padding: 2rem 3.6rem;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.project-name {
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
  margin-bottom: 2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-cover {
  width: 30rem;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 1.2rem;
  margin-bottom: 2rem;
}

.publish-btn {
  width: 100%;
  height: 4.8rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.6rem;
  font-weight: 500;
  background-color: #fb64b6;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

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

/* 右侧部分 */
.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem 2.4rem 2rem 2.4rem;
  background: #ffffff;
  overflow-y: auto;
  box-sizing: border-box;
}

.right-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-title {
  font-size: 1.4rem;
  color: #364153;
  flex-shrink: 0;
}

.episode-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  margin-bottom: 1.8rem;
}

.episode-tabs {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 0.4rem 0;
}

.episode-tab {
  min-width: 4rem;
  height: 4rem;
  background: #F5F5F5;
  border-radius: 0.6rem;
  cursor: pointer;
  font-size: 1.4rem;
  color: #6A7282;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background-color: rgba(251, 100, 182, 0.12);
    color: #FB64B6;
  }

  &:hover:not(.active) {
    color: #FB64B6;
  }
}

.nav-btn {
  width: 4rem;
  height: 4rem;
  background: #F5F5F5;
  border-radius: 0.6rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  img {
    width: 2.4rem;
    height: 2.4rem;
  }
}

.close-btn{
  position: absolute;
  right: 1.8rem;
  top: 1.8rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.right-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 2rem;
}

.episode-title {
  font-size: 1.2rem;
  color: #99A1AF;
  margin-bottom: 1rem;
}

.video-player {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 0.8rem;
  overflow: hidden;

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.video-loading,
.video-empty {
  width: 100%;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #6A7282;
  background: #F5F5F5;
  border-radius: 0.8rem;
}
</style>
