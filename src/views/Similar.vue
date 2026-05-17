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
              <img :src="item.cover" alt="" />
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
                <!-- Like Count -->
                <div class="content-stats" @click.stop="toggleLike(item)">
                  <img :src="item.is_liked == 1 ? likeActive : like" alt="" />
                  <span>{{ formatNumber(item.like_count || 0) }}</span>
                </div>
                <!-- Video Duration -->
                <div class="video-duration" v-if="item.type == '3' && item.duration">
                  {{ formatDuration(item.duration) }}
                </div>
              </div>
            </div>
            <div class="content-info">
              <div class="content-desc" v-if="item.title || item.description">{{ item.title ? item.title : item.description ? item.description : '' }}</div>
              <div class="content-meta">
                <div class="author-info" @click.stop="goToUserHome(item.author?.id || item.author_info?.id)">
                  <img :src="item.author?.avatar || item.author_info?.avatar || ''" alt="" class="author-avatar" />
                  <span class="author-name">{{ item.author?.nickname || item.author_info?.nickname }}</span>
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

import likeActive from '@/assets/images/detail/like_active.png';
import like from '@/assets/images/home/like.png';

// Types
interface Content {
  id: number;
  type: string;
  title: string;
  description: string;
  cover: string;
  time: string;
  duration: number;
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
  like_count: number;
  is_liked: number;
}

// State
const activeFilter = ref(0);
const contentList = ref<Content[] | null>(null);
const currentPage = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);

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

  try {
    const res = await api.getSimilar({
      type: activeFilter.value,
      page: currentPage.value,
      limit: pageSize.value
    }) as unknown as { code: number; msg: string; data?: any };

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
      const newContent = (res.data?.data || []).map((item: any) => {
        // Format timestamp to readable date
        const formatTime = (timestamp: string) => {
          const date = new Date(parseInt(timestamp) * 1000);
          return date.getFullYear() + '.' +
            String(date.getMonth() + 1).padStart(2, '0') + '.' +
            String(date.getDate()).padStart(2, '0') + ' ' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
        };

        return {
          id: item.id,
          type: item.type,
          title: item.title || '',
          description: item.content || '',
          cover: item.cover || '',
          time: formatTime(item.created_at),
          duration: item.duration || 0,
          author: item.author,
          author_info: item.author_info,
          like_count: parseInt(item.like_count || "0"),
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
      hasMore.value = loadedContent < totalContent;

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

function goToDetail(contentId: number, type: number) {
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
    const itemIndex = contentList.value?.findIndex(p => p.id === contentId);
    if (itemIndex === -1 || itemIndex === undefined) return;

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
    if (res.code === 0 || res.code === 200) {
      // Update the UI only after API success
      if (contentList.value) {
        contentList.value[itemIndex].is_liked = isCurrentlyLiked ? 0 : 1;
        contentList.value[itemIndex].like_count += isCurrentlyLiked ? -1 : 1;
      }
    } else {
      // Show error message if API call failed
      toast(t('common.fail'));
    }
  } catch (error) {
    console.error('Like/unlike error:', error);
    // Show error message if API call failed
    toast(t('common.fail'));
  }
}

function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

// Lifecycle
onMounted(async () => {
  window.scrollTo(0, 0);

  window.addEventListener("resize", layoutWaterfall);

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
      white-space: nowrap;
      overflow: hidden;
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

        .author-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 0.4rem;
          object-fit: cover;
        }

        .author-name {
          font-size: 1.2rem;
          color: #99A1AF;
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