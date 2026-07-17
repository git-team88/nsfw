<template>
  <div v-if="visible" class="comic-modal-overlay">
    <div class="view-modal">
      <div class="modal-content">
        <button class="close-btn" @click="handleClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.view-modal {
  position: relative;
  width: 980px;
  height: 570px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border-radius: 14px;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  overflow: hidden;
}

.modal-content {
  display: flex;
  height: 100%;
}

/* 左侧部分 */
.left-section {
  width: 372px;
  height: 100%;
  padding: 20px 36px;
  background: #FFEFF5;
  border-right: 2px solid #161122;
  display: flex;
  flex-direction: column;
}

.project-name {
  font-size: 16px;
  font-weight: 800;
  color: #161122;
  margin-bottom: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-cover {
  width: 300px;
  aspect-ratio: 3/4;
  object-fit: cover;
  border-radius: 14px;
  margin-bottom: 20px;
}

.publish-btn {
  width: 100%;
  height: 48px;
  border: 2px solid #161122;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #FF4D8D, #FF7A45);
  color: white;
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

  &:disabled {
    background: rgba(255, 77, 142, 0.4);
    color: #161122;
    cursor: not-allowed;
  }
}

/* 右侧部分 */
.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 560px;
  padding: 20px 24px 20px 24px;
  background: #ffffff;
  overflow-y: auto;
  box-sizing: border-box;
}

.right-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-title {
  font-size: 14px;
  font-weight: 800;
  color: #161122;
  flex-shrink: 0;
}

.episode-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin-bottom: 18px;
}

.episode-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 5px 5px 0;
}

.episode-tab {
  position: relative;
  min-width: 40px;
  height: 40px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.16);
  border: 2px solid #161122;
  border-radius: 11px;
  cursor: pointer;
  font-size: 14px;
  color: #161122;
  opacity: 0.65;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: #FF4D8E;
    color: #ffffff;
    opacity: 1;
  }

  &:hover:not(.active) {
    color: #161122;
    opacity: 1;
  }

  .published-icon {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 12px;
    height: 12px;
  }
}

.detail-title-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.published-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #161122;
  opacity: 0.4;

  .published-dot {
    width: 12px;
    height: 12px;
  }

  .published-text {
    font-size: 12px;
  }
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: #FFFDF7;
  border: 3px solid #161122;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
  border: 2px solid #161122;
  border-radius: 11px;
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
    width: 24px;
    height: 24px;
  }
}

.close-btn{
  background: #fff;
  border: 2.5px solid #161122;
  border-radius: 999px;
  padding: 6px;
  position: absolute;
  right: 18px;
  top: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  box-shadow: 2px 2px 0 #161122;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;

  &:hover {
    transform: scale(1.1);
  }
}

.right-body {
  flex: 1;
  overflow-y: auto;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.episode-title {
  font-size: 12px;
  color: #161122;
  opacity: 0.4;
  margin-bottom: 10px;
}

.video-player {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 312px;
  aspect-ratio: 16/9;
  background: #FFEFF5;
  border-radius: 14px;
  border: 2px solid #161122;
  overflow: hidden;
  position: relative;

  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

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
  height: 312px;
  aspect-ratio: 16/9;
  border-radius: 14px;
  border: 2px solid #161122;
  position: relative;
  cursor: pointer;
  background-color: #FFEFF5;

  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

  &.ratio-16-9 {
    aspect-ratio: 16/9;
    width: 100%;
  }
}

.cover-preview-image {
  width: 100%;
  height: 312px;
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
  width: 60px;
  height: 60px;
}

.video-loading,
.video-empty {
  width: 100%;
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #161122;
  opacity: 0.65;
  background: #FFEFF5;
  border-radius: 14px;
  border: 2px solid #161122;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #F3EFE7;
  border-top: 4px solid #161122;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #161122;
  opacity: 0.65;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Video ratio styles */
.video-cover-preview,
.video-player {
  &.ratio-9-16 {
    aspect-ratio: 9/16;
    max-width: 50%;
    margin: 0 auto;
  }

  &.ratio-16-9 {
    aspect-ratio: 16/9;
    width: 100%;
  }
}

/* Episode description */
.video-details {
  margin-top: 20px;
}

.video-cover {
  margin-bottom: 20px;

  h3 {
    font-size: 14px;
    font-weight: 800;
    color: #161122;
    margin-bottom: 10px;
  }

  .cover-image {
    width: 100%;
    border-radius: 14px;
    object-fit: cover;
  }
}

.video-images {
  margin-bottom: 20px;

  h3 {
    font-size: 14px;
    font-weight: 800;
    color: #161122;
    margin-bottom: 10px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }

  .video-detail-image {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 14px;
    object-fit: cover;
  }
}

/* Episode description */
.episode-description {
  .description-label {
    font-size: 12px;
    color: #161122;
    opacity: 0.4;
    margin-bottom: 10px;
  }

  .description-content {
    margin-bottom: 10px;
    font-size: 12px;
    line-height: 20px;
    color: #161122;
    opacity: 0.65;
    white-space: pre-wrap;
  }
}
</style>
