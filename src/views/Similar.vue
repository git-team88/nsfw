<template>
  <div class="similar-page">
    <Header :cur="-1"></Header>

    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <h1>{{ t('similar.title') }}</h1>

        <!-- Type Filters -->
        <div class="post-filters">
          <div
            v-for="filter in typeFilters"
            :key="filter.id"
            class="filter-item"
            :class="{ active: activeFilter == filter.id }"
            @click="setActiveFilter(filter.id)"
          >
            {{ filter.label }}
          </div>
        </div>
      </div>

      <!-- Content Grid (Masonry Layout) -->
      <div class="posts-container">
        <div
          class="waterfall"
          v-if="contentList && contentList.length > 0"
          ref="waterfallRef"
        >
          <div
            class="content-item"
            v-for="item in contentList"
            :key="item.id"
            ref="contentCardRefs"
            @click="goToDetail(item.id, parseInt(item.type))"
          >
            <div class="content-image">
                <img :src="item.cover || defaultCover" alt="" />
                <div class="r18-overlay" v-if="item.is_nsfw == 1">
                  <span class="r18-text">R18</span>
                </div>
                <!-- Type Icon -->
                <div class="type-icon" v-if="item.type">
                  <img v-if="item.type == '2'" src="@/assets/images/home/novel_icon.png" alt="" />
                  <img v-else-if="item.type == '1'" src="@/assets/images/home/comic_icon.png" alt="" />
                  <img v-else-if="item.type == '3'" src="@/assets/images/home/video_icon.png" alt="" />
                </div>
                <!-- Video Play Icon -->
                <div v-if="item.type == '3'" class="play-icon">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>
                <div class="content-bottom">
                  <!-- Update Time and Chapter Count -->
                  <div class="update-info">
                    <template v-if="item.status == 2">
                      <span>{{ t('home.statusFinished') }}</span>
                      <span v-if="item.total_post_nums || item.latest_post_chapter_index" class="chapter-divider">|</span>
                      <span v-if="item.total_post_nums || item.latest_post_chapter_index">
                        {{ item.type == '2' ? t('home.totalChapterFormat', { chapter: item.total_post_nums || item.latest_post_chapter_index }) : t('home.totalEpisodeFormat', { episode: item.total_post_nums || item.latest_post_chapter_index }) }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-if="item.latest_post_updated">{{ t(formatUpdateTime(item.latest_post_updated).key, formatUpdateTime(item.latest_post_updated).params || {}) }}</span>
                      <span v-if="item.latest_post_updated && item.latest_post_chapter_index" class="chapter-divider">|</span>
                      <span v-if="item.latest_post_chapter_index">
                        {{ item.type == '2' ? t('home.chapterFormat', { chapter: item.latest_post_chapter_index }) : t('home.episodeFormat', { episode: item.latest_post_chapter_index }) }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
              <div class="content-info">
                <div class="content-desc" v-if="item.title || item.description">{{ item.title ? item.title : item.description ? item.description : '' }}</div>
                <div class="content-meta">
                  <div class="author-info" @click.stop="goToUserHome(item.author?.id || item.author_info?.id)">
                    <img :src="item.author?.avatar || item.author_info?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                    <span class="author-name">{{ item.author?.nickname || item.author_info?.nickname }}</span>
                  </div>
                  <div class="content-stats-top">
                    <span>{{ formatNumber(item.all_like || 0) }}</span>
                    <img :src="like" alt="" />
                  </div>
                </div>
              </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading && !contentList" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ t('search.loading') }}</p>
        </div>

        <!-- Empty State -->
        <EmptyState v-else-if="contentList && contentList.length === 0" />

        <!-- Load More Indicator -->
        <div v-if="isLoadingMore" class="load-more-indicator">
          <div class="loading-spinner"></div>
          <p>{{ t('search.loadingMore') }}</p>
        </div>

        <!-- Infinite Scroll Sentinel -->
        <div ref="loadingSentinel" style="height: 1px; margin-top: 20px;"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Similar">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Header from '@/components/Header.vue';
import EmptyState from '@/components/EmptyState.vue';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { formatUpdateTime, initLanguage } from '@/util/utils';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

// Check if user is logged in
const checkLogin = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
};

import likeActive from '@/assets/images/home/like_active.png';
import like from '@/assets/images/home/like.png';
import defaultAvatar from "@/assets/images/base/avatar.png";
import defaultCover from "@/assets/images/base/cover.png";

// Types
interface Content {
  id: number;
  type: string;
  title: string;
  description: string;
  cover: string;
  created_at: string;
  latest_post_updated?: string;
  latest_post_chapter_index?: number;
  status?: number;
  total_post_nums?: number;
  author?: {
    avatar: string;
    nickname: string;
    id: number;
  };
  author_info?: {
    avatar: string;
    nickname: string;
    id: number;
  };
  all_like: number;
  is_liked: number;
  is_nsfw?: number | string;
}

// State
const activeFilter = ref(0);
const contentList = ref<Content[] | null>(null);
const currentPage = ref(1);
const pageSize = ref(48);
const hasMore = ref(true);
const userRegion = ref(false);
const hasFetchedRegion = ref(false);

// Type filters data
const typeFilters = ref([
  { id: 0, label: t('home.contentType.all') },
  { id: 2, label: t('home.contentType.novel') },
  { id: 1, label: t('home.contentType.comic') },
  { id: 3, label: t('home.contentType.drama') }
]);

// Refs for waterfall layout
const waterfallRef = ref<HTMLElement | null>(null);
const contentCardRefs = ref<HTMLElement[]>([]);
const loadingSentinel = ref<HTMLElement | null>(null);

// Loading
const isLoading = ref(false);
const isLoadingMore = ref(false);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

watch(() => locale.value, () => {
  typeFilters.value = [
    { id: 0, label: t('home.contentType.all') },
    { id: 2, label: t('home.contentType.novel') },
    { id: 1, label: t('home.contentType.comic') },
    { id: 3, label: t('home.contentType.drama') }
  ]

  // Re-trigger load when language changes
  if (contentList.value) {
    currentPage.value = 1;
    contentList.value = null;
    loadData();
  }
});

// Methods
function setActiveFilter(filter: number) {
  activeFilter.value = filter;
  currentPage.value = 1;
  hasMore.value = true;
  contentList.value = null;
  loadData();
}

async function loadData(fromLoadMore = false) {
  if (isLoading.value || isLoadingMore.value) return;

  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current filter and page at the time of the request
  const currentFilter = activeFilter.value;
  const currentPageValue = currentPage.value;

  if (fromLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }

  // Ensure we have the latest country info before making the request
  await getCountry();

  try {
    // Get language from URL parameter, fallback to system locale
    const urlLang = route.query.lang as string;
    const requestLang = urlLang || (locale.value == 'zh' ? 'cn' : locale.value);

    const showNsfw = userRegion.value ? (localStorage.getItem('allowSensitiveContent') == '1' ? 1 : 0) : 0;
    const urlSessionId = route.query.session_id as string;
    const urlCat = route.query.type ? parseInt(route.query.type as string) : 0;
    const res = await api.getRelativeByTopicPublic({
      session_id: urlSessionId || '',
      cat: urlCat,
      lang: requestLang,
      show_nsfw: showNsfw,
      page: currentPage.value,
      page_size: pageSize.value,
    }) as any;

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      isLoading.value = false;
      isLoadingMore.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the filter or page has changed while the request was in flight
    if (currentFilter !== activeFilter.value || currentPageValue !== currentPage.value) {
      isLoading.value = false;
      isLoadingMore.value = false;
      return; // Skip processing this response as the filter or page has changed
    }

    if (res.code == 0 || res.code == 200) {
      const data = res.data?.data || res.data || [];

      const newContent = data.map((item: any) => {
        return {
          id: item.id,
          type: item.type || 0,
          title: item.title || '',
          description: item.description || '',
          cover: item.cover || '',
          created_at: item.created_at,
          latest_post_updated: item.latest_post_updated,
          latest_post_chapter_index: item.latest_post_chapter_index,
          status: item.status,
          total_post_nums: item.total_post_nums,
          author: item.author,
          author_info: item.author_info,
          all_like: parseInt(item.all_like || "0"),
          is_liked: item.is_liked || 0,
        };
      });

      // For initial load, replace the list instead of pushing
      if (fromLoadMore) {
        // For load more, push to the list
        if (!contentList.value) {
          contentList.value = [];
        }
        contentList.value.push(...newContent);
      } else {
        // For initial load, replace the list
        contentList.value = newContent;
      }

      const totalContent = Number(res.data?.allnums) || 0;
      const loadedContent = contentList.value ? contentList.value.length : 0;
      hasMore.value = totalContent > pageSize.value && loadedContent < totalContent;

      currentPage.value++;

      // Update loading state immediately
      isLoading.value = false;
      isLoadingMore.value = false;

      // Wait for images to load before layout
      nextTick(() => {
        let loadedCount = 0;
        const total = newContent.length;
        if (total === 0) {
          layoutWaterfall();
          return;
        }

        newContent.forEach((item: Content) => {
          const img = new Image();
          img.src = item.cover;
          img.onload = img.onerror = () => {
            loadedCount++;
            if (loadedCount === total) {
              layoutWaterfall();
            }
          };
        });
      });
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  } catch (error) {
    console.error('Load similar content error:', error);
    toast(t('similar.loadFailed'));
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function loadMore() {
  if (isLoading.value || isLoadingMore.value) return;

  if (!hasMore.value) {
    return;
  }

  await loadData(true);  // 传入 true 表示是 loadMore 调用
}

// Waterfall layout function
const layoutWaterfall = () => {
  if (!waterfallRef.value || !contentList.value || contentList.value.length === 0) return;

  // Flex layout will handle positioning automatically
  // No need for absolute positioning calculations
};

function goToDetail(contentId: string | number, type: number) {
  if (type == 2) {
    router.replace(`/detail?id=${contentId}&type=6`);
  } else {
    router.push(`/detail?id=${contentId}&type=6`);
  }
}

function goToUserHome(userId: number | undefined) {
  if (userId) {
    router.push(`/user-home?id=${userId}`);
  }
}

async function toggleLike(item: Content) {
  // Check if user is logged in
  if (!checkLogin()) return;

  try {
    const contentId = item.id;
    // Find the item in the contentList
    const itemIndex = contentList.value?.findIndex(p => p.id == contentId);
    if (itemIndex == -1 || itemIndex == undefined) return;

    const isCurrentlyLiked = item.is_liked === 1;

    // Call the appropriate API first
    let res;
    if (isCurrentlyLiked) {
      // Unlike content
      res = await api.dislikePost({ post_id: contentId }) as any;
    } else {
      // Like content
      res = await api.likePost({ post_id: contentId }) as any;
    }

    // Check if API call was successful
    if (res.code == 0 || res.code == 200) {
      // Update the UI only after API success
      if (contentList.value) {
        contentList.value[itemIndex].is_liked = isCurrentlyLiked ? 0 : 1;
        contentList.value[itemIndex].all_like += isCurrentlyLiked ? -1 : 1;
      }
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Like/unlike error:', error);
    // Show error message if API call failed
    toast(t('common.fail'));
  }
}



function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toString();
}

// Get user region
function getCountry(): Promise<void> {
  // Only fetch region once per page load
  if (hasFetchedRegion.value) {
    return Promise.resolve();
  }

  return api.getCode().then((res: any) => {
    hasFetchedRegion.value = true;
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      userRegion.value = false;
    }
  }).catch(err => {
    console.log(err);
    userRegion.value = false;
    hasFetchedRegion.value = true;
  })
}

// Lifecycle
onMounted(async () => {
  // 初始化语言设置
  await initLanguage();

  window.scrollTo(0, 0);

  window.addEventListener("resize", layoutWaterfall);
  getCountry();

  // Set up intersection observer for infinite scroll
  // 使用 nextTick 确保 DOM 已渲染
  nextTick(() => {
    if (loadingSentinel.value) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            !isLoading.value &&
            !isLoadingMore.value &&
            hasMore.value
          ) {
            loadMore();
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
      observer.observe(loadingSentinel.value);

      // 保存 observer 以便清理
      (loadingSentinel.value as any)._observer = observer;
    }
  });

  // Check URL for type parameter and set active filter
  const typeParam = route.query.type;
  if (typeParam) {
    const type = parseInt(typeParam as string);
    // Map URL type to filter ID
    // URL type: 1=comic, 2=novel, 3=drama
    // Filter ID: 0=all, 1=comic, 2=novel, 3=drama
    let filterId = 0;
    switch (type) {
      case 1:
        filterId = 1; // Comic
        break;
      case 2:
        filterId = 2; // Novel
        break;
      case 3:
        filterId = 3; // Drama
        break;
      default:
        filterId = 0; // All
    }
    activeFilter.value = filterId;
  }

  // Always load data on mount
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", layoutWaterfall);

  // 清理 IntersectionObserver
  if (loadingSentinel.value && (loadingSentinel.value as any)._observer) {
    (loadingSentinel.value as any)._observer.disconnect();
  }
});

// Watch contentList to trigger layout when data changes
watch(contentList, () => {
  if (contentList.value && contentList.value.length > 0) {
    nextTick(() => {
      layoutWaterfall();
    });
  }
});
</script>

<style lang="scss" scoped>
.similar-page {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: #FFFFFF;
}

.container {
  max-width: 108rem;
  margin: 0 auto;
}

.page-header {
  margin: 2rem 0 2.4rem;

  h1 {
    font-size: 2rem;
    font-weight: 500;
    color: #101828;
    margin-bottom: 2.4rem;
  }

  .post-filters {
    display: flex;
    gap: 1.2rem;
    margin: 2.4rem 0;
    .filter-item {
      display: flex;
      align-items: center;
      height: 3.2rem;
      padding: 0 1.6rem;
      border-radius: 0.6rem;
      font-size: 1.4rem;
      color: #6A7282;
      cursor: pointer;

      &.active {
        background: #F5F5F5;
      }
    }
  }
}

/* Masonry Layout for Posts */
.posts-container {
  margin: 2.4rem 0;
  .waterfall {
    display: flex;
    flex-wrap: wrap;
    gap: 1.6rem;
    width: 100%;
    margin: 0 auto;
  }
}

.content-item {
  width: 25.8rem;
  cursor: pointer;
  overflow: hidden;
  break-inside: avoid;

  .content-image {
    width: 100%;
    height: 34.4rem;
    border-radius: 0.8rem;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      border-radius: 0.8rem;
      object-fit: cover;
    }

    .r18-overlay {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      height: 2.8rem;
      background: rgba(16,24,40,0.7);
      border-radius: 1.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.8rem;

      .r18-text {
        font-size: 1.4rem;
        font-weight: 500;
        color: #FFFFFF;
      }
    }

    /* Type Icon */
    .type-icon {
      position: absolute;
      top: 0.1rem;
      left: 0.1rem;
      z-index: 1;

      img {
        width: 4rem;
        height: 4rem;
        object-fit: contain;
      }
    }

    /* Play Icon */
    .play-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translateX(-50%) translateY(-42%);
      z-index: 1;

      img {
        width: 8rem;
        height: 8rem;
        object-fit: contain;
      }
    }

    .content-bottom{
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 6.4rem;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0 1.2rem 1.2rem;
      border-radius: 0 0 1.2rem 1.2rem;
      background: linear-gradient( 0deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
    }

    .content-stats {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      z-index: 1;

      span {
        font-size: 1.2rem;
        color: #FFFFFF;
      }

      img {
        width: 1.8rem;
        height: 1.8rem;
      }
    }

    .update-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.9);
      z-index: 1;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

      .chapter-divider {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .video-duration {
      font-size: 1.4rem;
      color: rgba(255, 255, 255, 0.7);
      z-index: 1;
    }
  }
  .content-info {
    padding: 1.2rem 0 0;

    .content-desc {
      margin-bottom: 1.2rem;
      font-size: 1.4rem;
      color: #101828;
      line-height: 2rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .content-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .author-info {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-width: 0;
        flex: 1;

        .author-avatar {
          width: 3rem;
          height: 3rem;
          flex-shrink: 0;
          border-radius: 0.4rem;
          object-fit: cover;
        }

        .author-name {
          font-size: 1.2rem;
          color: #99A1AF;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      .content-stats-top {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-shrink: 0;
        margin-left: 0.8rem;

        span {
          font-weight: 500;
          font-size: 1.2rem;
          color: #99A1AF;
        }

        img {
          width: 1.6rem;
          height: 1.6rem;
        }
      }
    }
  }
}

.loading-trigger {
  text-align: center;
  padding: 2rem 0;
  color: #99a1af;
  font-size: 1.4rem;
}

/* Loading and Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid #F5F5F5;
    border-top: 0.4rem solid #6A7282;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
  }
  p {
    font-size: 1.6rem;
    color: #6a7282;
  }
}

.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid #F5F5F5;
    border-top: 0.4rem solid #6A7282;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
  }
  p {
    font-size: 1.6rem;
    color: #6a7282;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>