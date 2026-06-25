<template>
  <div v-if="visible" class="comic-modal-overlay">
    <div class="view-modal">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')">
          <img src="@/assets/images/base/close.png" alt="Close" />
        </button>

        <!-- 左侧部分 -->
        <div class="left-section">
          <div class="project-name">{{ project?.name }}</div>
          <img :src="project?.result_async?.generate_manhua_cover" alt="Project cover" class="project-cover" />
          <button class="publish-btn" :class="{ 'published': isEpisodePublished }" :disabled="isEpisodePublished" @click="handlePublish">
            {{ isEpisodePublished ? t('submit.image.projectView.published') : t('submit.image.projectView.publishEpisode') }}
          </button>
        </div>

        <!-- 右侧部分 -->
        <div class="right-section">
          <div class="right-header">
            <div class="detail-title-container">
              <span class="detail-title">{{ t('submit.image.projectView.detail') }}</span>
              <div v-if="currentChapter?.is_publish == 1" class="published-badge">
                <img class="published-dot" src="@/assets/images/publish/publish.png" alt="" />
                <span class="published-text">{{ t('submit.image.projectView.publishedIndicator') }}</span>
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
                  :class="{ active: selectedEpisode == episode.chapter }"
                  @click="selectEpisode(episode.chapter)"
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
            <div class="episode-title">{{ t('submit.image.projectView.episodeSummary') }}</div>
            <p class="episode-desc">{{ chapterDescription }}</p>
            <div class="episode-images" v-if="!isLoading">
              <img
                v-for="(image, index) in episodeImages"
                :key="index"
                :src="image"
                alt="Episode image"
                class="episode-image"
              />
            </div>
            <div class="loading-state" v-if="isLoading">
              <div class="loading-spinner"></div>
              <span class="loading-text">{{ t('loading') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ProjectCoimcViewModal">
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

const emit = defineEmits(['close', 'publish']);

const selectedEpisode = ref(1);
const currentPage = ref(1);
const episodesPerPage = 10;
// 计算总集数
const totalEpisodes = computed(() => {
  // 优先使用 project 中已生成的集数信息
  if (props.project?.chapters) {
    // 显示所有章节，不需要过滤
    return props.project.chapters.length;
  } else if (props.project?.total_episodes) {
    return props.project.total_episodes;
  } else if (props.project?.totalEpisodes) {
    return props.project.totalEpisodes;
  }
  // 其次使用 step_chapter_index（已生成的章节数）
  else if (props.project?.step_chapter_index) {
    // 如果 step_status 是 SUCCESS，则使用 step_chapter_index
    // 如果 step_status 是 DOING，则使用 step_chapter_index - 1
    if (props.project.step_status === 'SUCCESS') {
      return props.project.step_chapter_index;
    } else if (props.project.step_status === 'DOING' && props.project.step_chapter_index > 1) {
      return props.project.step_chapter_index - 1;
    }
  }
  // 最后使用默认值
  return 1;
});
const isLoading = ref(false);
const chapterData = ref<any>(null);

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalEpisodes.value / episodesPerPage);
});

// 计算当前页显示的集数
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

// 集数描述 - 使用真实数据
const episodeDescription = computed(() => {
  if (props.project?.chapters) {
    const chapter = props.project.chapters.find((item: any) => item.chapter == selectedEpisode.value);
    return chapter?.description || '';
  } else if (props.project?.result_async?.generate_manhua_outline?.outline) {
    const outline = props.project.result_async.generate_manhua_outline.outline;
    const currentEpisode = outline.find((item: any) => item.chapter == selectedEpisode.value);
    return currentEpisode?.description || '';
  }

  return '';
});

// 章节详情描述
const chapterDescription = computed(() => {
  if (chapterData.value?.chapter_description) {
    return chapterData.value.chapter_description;
  }
  return '';
});

// 集数图片 - 使用真实数据（final_images）
const episodeImages = computed(() => {
  return chapterData.value?.final_images || chapterData.value?.images || chapterData.value?.result_async?.final_images || chapterData.value?.result_async?.images || [];
});

// 当前章节信息
const currentChapter = computed(() => {
  if (props.project?.chapters) {
    return props.project.chapters.find((item: any) => item.chapter == selectedEpisode.value);
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

// 获取章节详情
async function fetchChapterDetail() {
  if (!props.project?.session_id) return;

  isLoading.value = true;
  try {
    const res = await api.detailChapter(props.project.session_id, selectedEpisode.value) as any;

    if (res.code == 200 && res.data) {
      chapterData.value = res.data;
    } else {
      toast(t('fail'));
    }
  } catch (error) {
    console.log('Error fetching chapter detail:', error);
  } finally {
    isLoading.value = false;
  }
}

// 选择集数时获取章节详情
function selectEpisode(episode: number) {
  selectedEpisode.value = episode;
  fetchChapterDetail();
}

// 监听 project 变化，初始化数据
watch(() => props.project, () => {
  if (props.project) {
    if (props.project.chapters) {
      // 显示所有章节并按 chapter 排序
      const allChapters = props.project.chapters
        .sort((a: any, b: any) => a.chapter - b.chapter);

      if (allChapters.length > 0) {
        selectedEpisode.value = allChapters[0].chapter;
        fetchChapterDetail();
        return;
      }
    }
    // 原逻辑作为备用
    selectedEpisode.value = 1;
    fetchChapterDetail();
  }
}, { immediate: true });

// 发布本集
async function handlePublish() {
  trackClickPublishButton(3);

  // Check if episode is already published via API
  if (props.project?.session_id && selectedEpisode.value) {
    try {
      const chapterRes = await api.detailChapter(props.project.session_id, selectedEpisode.value) as any;
      if (chapterRes.code === 200 && chapterRes.data && chapterRes.data.is_publish === 1) {
        toast(t('submit.image.episodeAlreadyPublished'));
        setTimeout(() => { location.reload(); }, 1000);
        return;
      }
    } catch (error) {
      console.error('Error checking episode publish status:', error);
    }
  }

  // Get cover from project (合集封面)
  const cover = props.project.cover || props.project.result_async?.generate_manhua_cover;
  
  emit('publish', {
    project: props.project,
    episode: selectedEpisode.value,
    session_id: props.project?.session_id,
    cover: cover
  });
}

// 上一页
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}
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

.close-btn {
  position: absolute;
  top: 1.8rem;
  right: 1.8rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 2rem;
    height: 2rem;
  }
}

.right-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
}

.episode-title {
  font-size: 1.2rem;
  color: #99A1AF;
  margin-bottom: 1rem;
}

.episode-desc {
  font-size: 1.2rem;
  color: #6A7282;
  line-height: 1.8rem;
  margin-bottom: 1rem;
}

.episode-images {
  display: flex;
  flex-direction: column;
}

.episode-image {
  width: 100%;
  object-fit: cover;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loading-spinner {
  width: 4rem;
  height: 4rem;
  border: 0.4rem solid #F5F5F5;
  border-top: 0.4rem solid #FB64B6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.2rem;
}

.loading-text {
  font-size: 1.4rem;
  color: #6A7282;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
