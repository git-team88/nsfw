<template>
  <div v-if="visible" class="comic-modal-overlay">
    <div class="view-modal">
      <div class="modal-content">
        <img class="close-btn" @click="handleClose" src="@/assets/images/base/close.png" alt="Close" />

        <!-- 左侧部分 -->
        <div class="left-section">
          <div class="project-name">{{ project?.name }}</div>
          <img :src="project?.result_async?.generate_manju_cover" alt="Project cover" class="project-cover" />
          <button class="publish-btn" :class="{ 'published': isEpisodePublished }" :disabled="isEpisodePublished" @click="handlePublish">
            {{ isEpisodePublished ? t('submit.video.projectView.published') : t('submit.video.projectView.publishEpisode') }}
          </button>
        </div>

        <!-- 右侧部分 -->
        <div class="right-section">
          <div class="right-header">
            <div class="detail-title-container">
              <span class="detail-title">{{ t('submit.video.projectView.detail') }}</span>
              <div v-if="currentChapter?.is_publish == 1" class="published-badge">
                <img class="published-dot" src="@/assets/images/publish/publish.png" alt="" />
                <span class="published-text">{{ t('submit.video.projectView.publishedIndicator') }}</span>
              </div>
            </div>
            <div class="episode-nav">
              <button v-if="currentPage > 1" class="nav-btn prev" @click="prevPage">
                <img src="@/assets/images/publish/prev.png" alt="Previous" />
              </button>
              <div class="episode-tabs">
                <button
                  v-for="episode in visibleEpisodes"
                  :key="episode.chapter"
                  class="episode-tab"
                  :class="{ active: selectedEpisode == episode.chapter.toString() }"
                  @click="selectEpisode(episode.chapter.toString())"
                >
                  {{ episode.chapter }}
                  <img v-if="episode.is_publish == 1" class="published-icon" src="@/assets/images/publish/publish.png" alt="" />
                </button>
              </div>
              <button v-if="currentPage < totalPages" class="nav-btn next" @click="nextPage">
                <img src="@/assets/images/publish/next.png" alt="Next" />
              </button>
            </div>
          </div>

          <div class="right-body">
            <div class="episode-description">
              <div class="description-label">{{ t('submit.video.projectView.episodeSummary') }}</div>
              <div class="description-content">{{ chapterDescription }}</div>
            </div>

            <!-- Show loading when initializing or loading data -->
            <div class="video-loading" v-if="initializing || loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">{{ t('loading') }}</span>
            </div>
            <!-- Default: Show cover with play button -->
            <div class="video-cover-preview" v-else-if="chapterData?.result_async?.final_video_output?.video_cover_url && !isPlaying" :class="videoRatio ? 'ratio-' + videoRatio.replace(':', '-') : ''">
              <img :src="chapterData.result_async?.final_video_output.video_cover_url" alt="Video cover" class="cover-preview-image" />
              <div class="cover-play-overlay" @click="playVideo">
                <img src="@/assets/images/publish/play_icon.png" alt="" class="cover-play-button" />
              </div>
            </div>

            <!-- Show video player when playing -->
            <div class="video-player" v-else-if="currentVideoUrl && isPlaying" :class="videoRatio ? 'ratio-' + videoRatio.replace(':', '-') : ''">
              <video
                ref="videoPlayer"
                :src="currentVideoUrl"
                controls
                class="video-element"
              ></video>
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

// Episode selection
const selectedEpisode = ref('1');
const currentPage = ref(1);
const episodesPerPage = 10;
const loading = ref(false);
const currentVideoUrl = ref('');
const videoPlayer = ref<HTMLVideoElement | null>(null);

// Episode details
const chapterData = ref<any>(null);

// Video playback state
const isPlaying = ref(false);

// Video ratio (9:16 or 16:9)
const videoRatio = computed(() => {
  if (props.project?.result_async?.user_selected?.ratio) {
    return props.project.result_async.user_selected.ratio;
  }
  return '';
});

// Initializing state to show loading from start
const initializing = ref(true);

// Get episodes from project outline
const episodes = computed(() => {
  if (!props.project) return [];

  // 优先使用 project.chapters 显示所有章节
  if (props.project.chapters) {
    return props.project.chapters
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
    // 显示所有章节并按 chapter 排序
    const allChapters = props.project.chapters
      .sort((a: any, b: any) => a.chapter - b.chapter);

    // 计算当前页的章节
    const start = (currentPage.value - 1) * episodesPerPage;
    const end = start + episodesPerPage;
    return allChapters.slice(start, end);
  } else {
    // 原逻辑作为备用
    const start = (currentPage.value - 1) * episodesPerPage + 1;
    const end = Math.min(start + episodesPerPage - 1, totalEpisodes.value);
    const episodes = [];
    for (let i = start; i <= end; i++) {
      episodes.push({ chapter: i, is_publish: 2 }); // 默认未发布
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

// Current chapter information
const currentChapter = computed(() => {
  if (props.project?.chapters) {
    return props.project.chapters.find((item: any) => item.chapter?.toString() === selectedEpisode.value);
  }
  return null;
});

// Check if current episode is published
const isEpisodePublished = computed(() => {
  if (!currentChapter.value) {
    return false;
  }
  return Number(currentChapter.value.is_publish) === 1;
});

// Episode description
const chapterDescription = computed(() => {
  if (chapterData.value?.chapter_description) {
    return chapterData.value.chapter_description;
  }
  return '';
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
      chapterData.value = null;
      return;
    }

    // Call API to fetch episode details
    const res = await api.detailChapter(sessionId, parseInt(episodeNumber)) as any;
    if (res.code == 200) {
      const result = res.data;
      chapterData.value = result;

      // Get video URL from final_video_output.video_url
      if (result.result_async && result.result_async.final_video_output?.video_url) {
        currentVideoUrl.value = result.result_async.final_video_output.video_url;
      } else {
        currentVideoUrl.value = '';
      }
    } else {
      currentVideoUrl.value = '';
      chapterData.value = null;
    }
  } catch (error) {
    console.error('Error fetching episode details:', error);
    currentVideoUrl.value = '';
    chapterData.value = null;
  } finally {
    loading.value = false;
    initializing.value = false;
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
  trackClickPublishButton(3);
  // Get cover from project (合集封面)
  const cover = props.project.cover || props.project.result_async?.generate_manju_cover;
  
  emit('publish', {
    project: props.project,
    episode: parseInt(selectedEpisode.value),
    session_id: props.project?.session_id,
    cover: cover
  });
}

// Play video
function playVideo() {
  isPlaying.value = true;
  if (videoPlayer.value) {
    videoPlayer.value.play();
  }
}

// Convert ratio string to CSS class name
function getRatioClass(ratio: string): string {
  if (!ratio) return '';
  const className = ratio.replace(/:/, '-').replace(/^/, 'ratio-');
  console.log('Ratio:', ratio, '→ Class:', className);
  return className;
}

// Watch for project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    isPlaying.value = false;
    if (newProject.chapters) {
      // 显示所有章节并按 chapter 排序
      const allChapters = newProject.chapters
        .sort((a: any, b: any) => a.chapter - b.chapter);

      if (allChapters.length > 0) {
        selectedEpisode.value = allChapters[0].chapter.toString();
        fetchEpisodeDetails(allChapters[0].chapter.toString());
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
    isPlaying.value = false;
    if (props.project.chapters) {
      // 显示所有章节并按 chapter 排序
      const allChapters = props.project.chapters
        .sort((a: any, b: any) => a.chapter - b.chapter);

      if (allChapters.length > 0) {
        selectedEpisode.value = allChapters[0].chapter.toString();
        fetchEpisodeDetails(allChapters[0].chapter.toString());
        return;
      }
    }
    // 原逻辑作为备用
    fetchEpisodeDetails('1');
  }
});

// Watch for episode changes
watch(selectedEpisode, () => {
  isPlaying.value = false;
});

onMounted(() => {
  if (props.project) {
    isPlaying.value = false;
    if (props.project.chapters) {
      // 显示所有章节并按 chapter 排序
      const allChapters = props.project.chapters
        .sort((a: any, b: any) => a.chapter - b.chapter);

      if (allChapters.length > 0) {
        selectedEpisode.value = allChapters[0].chapter.toString();
        fetchEpisodeDetails(allChapters[0].chapter.toString());
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
  height: 57rem;
  background: #FFFFFF;
  border-radius: 1.2rem;
  overflow: hidden;
}

.modal-content {
  display: flex;
  height: 100%;
}

/* 左侧部分 */
.left-section {
  width: 37.2rem;
  height: 100%;
  padding: 2rem 3.6rem;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
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

  &.published {
    background-color: rgba(251, 100, 182, 0.5);
    color: #FFFFFF;
    cursor: not-allowed;

    &:hover {
      &::after {
        display: none;
      }
    }
  }

  &:disabled {
    background-color: rgba(251, 100, 182, 0.5);
    color: #FFFFFF;
    cursor: not-allowed;
  }
}

/* 右侧部分 */
.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 56rem;
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
  padding: 0 0 0.4rem;
}

.episode-tab {
  position: relative;
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

  .published-icon {
    position: absolute;
    right: 0.4rem;
    bottom: 0.4rem;
    width: 1.2rem;
    height: 1.2rem;
  }
}

.detail-title-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.published-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.2rem;
  color: #99A1AF;

  .published-dot {
    width: 1.2rem;
    height: 1.2rem;
  }

  .published-text {
    font-size: 1.2rem;
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
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.episode-title {
  font-size: 1.2rem;
  color: #99A1AF;
  margin-bottom: 1rem;
}

.video-player {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 31.2rem;
  aspect-ratio: 16/9;
  background: #F5F5F5;
  border-radius: 0.8rem;
  overflow: hidden;
  position: relative;

  // 9:16 vertical video - centered with max width
  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

  // 16:9 landscape video - full width
  &.ratio-16-9 {
    aspect-ratio: 16/9;
    width: 100%;
  }

  .video-element {
    height: 100%;
    object-fit: contain;
  }
}

/* Video cover preview with play button */
.video-cover-preview {
  width: 100%;
  height: 31.2rem;
  aspect-ratio: 16/9;
  border-radius: 0.8rem;
  position: relative;
  cursor: pointer;
  background-color: #F5F5F5;

  // 9:16 vertical video - centered with max width
  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

  // 16:9 landscape video - full width
  &.ratio-16-9 {
    aspect-ratio: 16/9;
    width: 100%;
  }
}

.cover-preview-image {
  width: 100%;
  height: 31.2rem;
  object-fit: contain;
}

.cover-play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-play-button {
  width: 6rem;
  height: 6rem;
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

/* Video ratio styles */
.video-cover-preview,
.video-player {
  // 9:16 vertical video - centered with max width
  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

  // 16:9 landscape video - full width
  &.ratio-16-9 {
    aspect-ratio: 16/9;
    width: 100%;
  }
}

/* Episode description */
.video-details {
  margin-top: 2rem;
}

.video-cover {
  margin-bottom: 2rem;

  h3 {
    font-size: 1.4rem;
    color: #364153;
    margin-bottom: 1rem;
  }

  .cover-image {
    width: 100%;
    border-radius: 0.8rem;
    object-fit: cover;
  }
}

.video-images {
  margin-bottom: 2rem;

  h3 {
    font-size: 1.4rem;
    color: #364153;
    margin-bottom: 1rem;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .video-detail-image {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 0.8rem;
    object-fit: cover;
  }
}

/* Episode description */
.episode-description {
  .description-label {
    font-size: 1.2rem;
    color: #99A1AF;
    margin-bottom: 1rem;
  }

  .description-content {
    margin-bottom: 1rem;
    font-size: 1.2rem;
    line-height: 2rem;
    color: #6A7282;
    white-space: pre-wrap;
  }
}
</style>
