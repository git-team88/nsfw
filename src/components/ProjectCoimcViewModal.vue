<template>
  <div v-if="visible" class="comic-modal-overlay">
    <div class="view-modal">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>

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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.view-modal {
  position: relative;
  width: 980px;
  height: calc(100vh - 340px);
  max-height: 560px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  overflow: hidden;
}

.modal-content {
  display: flex;
  height: 560px;
}

/* 左侧部分 */
.left-section {
  width: 372px;
  height: 100%;
  padding: 20px 36px;
  background: rgba(255,79,154,0.08);
  border-right: 1px solid #3d3d3d;
  display: flex;
  flex-direction: column;
}

.project-name {
  font-size: 16px;
  font-weight: 800;
  color: #f5f5f5;
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
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
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

  &:disabled {
    background: rgba(255,79,154,0.15);
    color: #f5f5f5;
    cursor: not-allowed;
  }
}

/* 右侧部分 */
.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 24px 20px 24px;
  background: #1a1a1a;
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
  color: #f5f5f5;
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
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: none;
  border: 1px solid #3d3d3d;
  border-radius: 11px;
  cursor: pointer;
  font-size: 14px;
  color: #f5f5f5;
  opacity: 0.65;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
    color: #f5f5f5;
    opacity: 1;
  }

  &:hover:not(.active) {
    color: #f5f5f5;
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
  color: #f5f5f5;
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
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  border: 1px solid #3d3d3d;
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

.close-btn {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 999px;
  padding: 6px;
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.right-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 10px;
}

.episode-title {
  font-size: 12px;
  color: #f5f5f5;
  opacity: 0.4;
  margin-bottom: 10px;
}

.episode-desc {
  font-size: 12px;
  color: #f5f5f5;
  opacity: 0.65;
  line-height: 18px;
  margin-bottom: 10px;
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
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3d3d3d;
  border-top: 4px solid #f5f5f5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #f5f5f5;
  opacity: 0.65;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
