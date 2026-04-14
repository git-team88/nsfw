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
          <img :src="project?.result_async?.generate_manhua_cover || project?.cover || 'https://picsum.photos/300/400?random=1'" alt="Project cover" class="project-cover" />
          <button class="publish-btn" @click="$emit('publish', project, selectedEpisode)">{{ t('submit.image.projectView.publishEpisode') }}</button>
        </div>

        <!-- 右侧部分 -->
        <div class="right-section">
          <div class="right-header">
            <span class="detail-title">{{ t('submit.image.projectView.detail') }}</span>
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
                  @click="selectEpisode(episode)"
                >{{ episode }}</button>
              </div>
              <button v-if="currentPage < totalPages" class="nav-btn next" @click="nextPage">
                <img src="@/assets/images/publish/next.png" alt="Next" />
              </button>
            </div>
          </div>

          <div class="right-body">
            <div class="episode-title">{{ t('submit.image.projectView.episodeSummary') }}</div>
            <p class="episode-desc" v-if="isLoading">{{ t('loading') }}</p>
            <p class="episode-desc" v-else>{{ episodeDescription }}</p>
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
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
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

const selectedEpisode = ref(1);
const currentPage = ref(1);
const episodesPerPage = 10;
const totalEpisodes = computed(() => {
  // 优先使用 project 中已生成的集数信息
  if (props.project?.chapters) {
    // 过滤出未发布的章节
    const unpublishedChapters = props.project.chapters.filter((chapter: any) => chapter.is_publish === 2);
    return unpublishedChapters.length;
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

// 集数图片 - 使用真实数据（final_images）
const episodeImages = computed(() => {
  return chapterData.value?.final_images || chapterData.value?.images || chapterData.value?.result_async?.final_images || chapterData.value?.result_async?.images || [];
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

// 监听选中集数变化
watch(selectedEpisode, () => {
  fetchChapterDetail();
});

// 监听 project 变化，初始化数据
watch(() => props.project, () => {
  if (props.project) {
    if (props.project.chapters) {
      // 过滤出未发布的章节并按 chapter 排序
      const unpublishedChapters = props.project.chapters
        .filter((chapter: any) => chapter.is_publish === 2)
        .sort((a: any, b: any) => a.chapter - b.chapter);

      if (unpublishedChapters.length > 0) {
        selectedEpisode.value = unpublishedChapters[0].chapter;
        fetchChapterDetail();
        return;
      }
    }
    // 原逻辑作为备用
    selectedEpisode.value = 1;
    fetchChapterDetail();
  }
}, { immediate: true });

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

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
    width: 1.6rem;
    height: 1.6rem;
  }
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
