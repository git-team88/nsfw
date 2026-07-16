<template>
  <div class="search-page">
    <Header :cur="-1"></Header>

    <div class="container">
      <!-- Search Panel -->
      <div class="search-panel">
        <!-- Search Bar -->
        <div class="search-bar">
          <div class="search-input-wrap">
            <input
              v-model="inputKeyword"
              type="text"
              class="search-input"
              :placeholder="t('search.placeholder')"
              @keyup.enter="performSearch"
            />
            <img class="search-btn" src="@/assets/images/user/search.png" alt="Search" @click="performSearch" />
          </div>
        </div>

        <!-- Search Results -->
        <div class="search-results">
          <div class="results-header">
            <h2>{{ t('search.resultsFor') }}
              <span v-if="searchKeyword">[{{ searchKeyword }}]</span>
            </h2>

            <!-- Tabs: Posts / users -->
            <div class="result-tabs">
              <div
                v-for="tab in tabs"
                :key="tab.value"
                class="tab-item"
                :class="{ active: activeTab === tab.value }"
                @click="switchTab(tab.value)"
              >
                {{ tab.label }}
              </div>
            </div>

            <!-- Post Type Filters -->
            <div class="post-filters" v-if="activeTab === 'posts'">
              <div
                v-for="filter in postFilters"
                :key="filter.id"
                class="filter-item"
                :class="{ active: postFilter == filter.id }"
                @click="setPostFilter(filter.id)"
              >
                {{ filter.label }}
              </div>
            </div>
          </div>
      </div>

      <!-- Search Results -->
      <div class="search-results">
        <div class="results-header">
          <h2>{{ t('search.resultsFor') }}
            <span>[{{ searchKeyword }}]</span>
          </h2>

          <!-- Tabs: Posts / Users -->
          <div class="result-tabs">
            <div
              v-for="tab in tabs"
              :key="tab.value"
              class="tab-item"
              :class="{ active: activeTab === tab.value }"
              @click="switchTab(tab.value)"
            >
              {{ tab.label }}
            </div>
          </div>

          <!-- Post Type Filters -->
          <div class="post-filters" v-if="activeTab === 'posts'">
            <div
              v-for="filter in postFilters"
              :key="filter.id"
              class="filter-item"
              :class="{ active: postFilter == filter.id }"
              @click="setPostFilter(filter.id)"
            >
              {{ filter.label }}
            </div>
          </div>
        </div>

        <!-- Posts Grid (Masonry Layout) -->
        <div v-if="activeTab == 'posts'" class="posts-container">
          <div
            class="waterfall"
            v-if="postList && postList.length > 0"
            ref="waterfallRef"
          >
            <div
              class="content-item"
              v-for="(post, index) in postList"
              :key="post.id"
              ref="postCardRefs"
              :style="{ animationDelay: `${Math.min(index, 10) * 45}ms` }"
              @click="goToDetail(post.id)"
            >
              <div class="content-image">
                <img :src="post.cover || defaultCover" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultCover }" />
                <div class="r18-overlay" v-if="post.is_nsfw == 1">
                  <span class="r18-text">R18</span>
                </div>
                <!-- Type Icon -->
                <div class="type-icon" v-if="post.type">
                  <img v-if="post.type == '2'" src="@/assets/images/home/novel_icon.png" alt="" />
                  <img v-else-if="post.type == '1'" src="@/assets/images/home/comic_icon.png" alt="" />
                  <img v-else-if="post.type == '3'" src="@/assets/images/home/video_icon.png" alt="" />
                </div>
                <!-- Video Play Icon -->
                <div v-if="post.type == '3'" class="play-icon">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>
                <div class="content-bottom">
                  <!-- Update Time and Chapter Count -->
                  <div class="update-info">
                    <template v-if="post.status == 2">
                      <span>{{ t('home.statusFinished') }}</span>
                      <span v-if="post.total_post_nums || post.latest_post_chapter_index" class="chapter-divider">|</span>
                      <span v-if="post.total_post_nums || post.latest_post_chapter_index">
                        {{ post.type == '2' ? t('home.totalChapterFormat', { chapter: post.total_post_nums || post.latest_post_chapter_index }) : t('home.totalEpisodeFormat', { episode: post.total_post_nums || post.latest_post_chapter_index }) }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-if="post.latest_post_updated">{{ t(formatUpdateTime(post.latest_post_updated).key, formatUpdateTime(post.latest_post_updated).params || {}) }}</span>
                      <span v-if="post.latest_post_updated && post.latest_post_chapter_index" class="chapter-divider">|</span>
                      <span v-if="post.latest_post_chapter_index">
                        {{ post.type == '2' ? t('home.chapterFormat', { chapter: post.latest_post_chapter_index }) : t('home.episodeFormat', { episode: post.latest_post_chapter_index }) }}
                      </span>
                    </template>
                  </div>
                  <!-- Video Duration -->
                  <!-- <div class="video-duration" v-if="post.type == '3' && post.duration">
                    {{ formatDuration(post.duration) }}
                  </div> -->
                </div>
              </div>
              <div class="content-info">
                <div class="content-desc" v-if="post.title || post.description">{{ post.title ? post.title : post.description ? post.description : '' }}</div>
                <div class="content-meta">
                  <div class="author-info" @click.stop="goToUserHome(post.author?.id)">
                    <img :src="post.author?.avatar || defaultAvatar" alt="" class="author-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                    <span class="author-name">{{ post.author?.nickname }}</span>
                  </div>
                  <div class="content-stats-top">
                    <span>{{ formatNumber(post.all_like) }}</span>
                    <img :src="like" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Users List -->
        <div v-else-if="activeTab === 'users'" class="users-list">
          <div
            v-for="(user, index) in users"
            :key="user.id"
            class="user-card"
            :style="{ animationDelay: `${Math.min(index, 10) * 45}ms` }"
            @click="goToUserHome(user.id)"
          >
            <div class="card-top">
              <img :src="user.avatar || defaultAvatar" alt="Avatar" class="user-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
              <div class="user-meta">
                <div class="nickname">{{ user.nickname }}</div>
                <div class="fans-count">
                  {{ formatNumber(user.follower_count) }} {{ t('userHome.fans') }}
                </div>
              </div>
              <button
                v-if="user.id != uid"
                class="follow-btn"
                :class="{ followed: user.is_followed }"
                @click.stop="toggleFollow(user)"
              >
                <span class="btn-text">{{
                  user.is_followed
                    ? t('search.following')
                    : t('search.follow')
                }}</span>
                <span class="hover-text" v-if="user.is_followed">{{
                  t('search.unfollow')
                }}</span>
              </button>
            </div>
            <div class="card-bio">{{ user.page?.page_desc || '' }}</div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading && ((activeTab === 'posts' && !postList) || (activeTab === 'users' && users.length === 0))" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ t('search.loading') }}</p>
        </div>

        <!-- Empty State -->
        <EmptyState v-else-if="(activeTab === 'posts' && postList && postList.length === 0) || (activeTab === 'users' && users.length === 0)" />

        <!-- Load More Indicator -->
        <div v-if="isLoadingMore" class="load-more-indicator">
          <div class="loading-spinner small"></div>
          <p>{{ t('search.loadingMore') }}</p>
        </div>

        <!-- Infinite Scroll Sentinel -->
        <div ref="loadingSentinel" style="height: 1px; margin-top: 20px;"></div>
      </div>
      </div><!-- end search-panel -->
    </div>
  </div>
</template>

<script setup lang="ts" name="Search">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, type CSSProperties } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Header from '@/components/Header.vue';
import EmptyState from '@/components/EmptyState.vue';
import api from '@/api/index';
import { toast } from '@/util/toast';
import { formatUpdateTime, initLanguage, processImageUrl } from '@/util/utils';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const uid = localStorage.getItem('uid');

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
interface Post {
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
  author: {
    avatar: string;
    nickname: string;
    id: number;
  }
  all_like: number;
  isLiked: boolean;
  is_nsfw: number | string;
}

// State
const inputKeyword = ref(route.query.keyword as string || '');
const searchKeyword = ref(route.query.keyword as string || '');
const activeTab = ref(route.query.type === 'user' ? 'users' : 'posts');
const postFilter = ref(0);
const userRegion = ref(false);
const hasFetchedRegion = ref(false);

// Tabs and filters data
const tabs = ref([
  { value: 'posts', label: t('search.posts') },
  { value: 'users', label: t('search.users') }
]);

const postFilters = ref([
  { id: 0, label: t('home.contentType.all') },
  { id: 2, label: t('home.contentType.novel') },
  { id: 1, label: t('home.contentType.comic') },
  { id: 3, label: t('home.contentType.drama') }
]);

// Refs for waterfall layout
const waterfallRef = ref<HTMLElement | null>(null);
const postCardRefs = ref<HTMLElement[]>([]);
const containerHeight = ref(0);
const loadingSentinel = ref<HTMLElement | null>(null);

// Posts
const postList = ref<Post[] | null>(null);
const postsPage = ref(1);
const postsLimit = ref(48);
const postsHasMore = ref(true);

// Users
const users = ref<any[]>([]);
const usersPage = ref(1);
const usersHasMore = ref(true);

// Loading
const isLoading = ref(false);
const isLoadingMore = ref(false);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

watch(() => locale.value, () => {
  tabs.value = [
    { value: 'posts', label: t('search.posts') },
    { value: 'users', label: t('search.users') }
  ]

  postFilters.value = [
    { id: 0, label: t('home.contentType.all') },
    { id: 2, label: t('home.contentType.novel') },
    { id: 1, label: t('home.contentType.comic') },
    { id: 3, label: t('home.contentType.drama') }
  ]

  // Re-trigger search when language changes
  if (searchKeyword.value || postList.value) {
    postsPage.value = 1;
    postList.value = null;
    performSearch();
  }
});

// Methods
function performSearch() {
  // Update searchKeyword with the input value
  searchKeyword.value = inputKeyword.value;

  // Update URL with the new keyword
  router.replace({
    path: '/search',
    query: {
      keyword: inputKeyword.value,
      type: activeTab.value === 'users' ? 'user' : 'post'
    }
  });

  if (activeTab.value === 'posts') {
    postsPage.value = 1;
    postsHasMore.value = true;
    postList.value = null;
  } else {
    usersPage.value = 1;
    usersHasMore.value = true;
    users.value = [];
  }

  loadData();
}

function switchTab(tab: string) {
  activeTab.value = tab;

  // Update URL with the new tab type
  router.replace({
    path: '/search',
    query: {
      keyword: searchKeyword.value,
      type: tab === 'users' ? 'user' : 'post'
    }
  });

  // Reset loading states
  isLoading.value = false;
  isLoadingMore.value = false;

  // Always load data when switching tabs, regardless of keyword
  if (tab === 'posts') {
    postsPage.value = 1;
    postsHasMore.value = true;
    postList.value = null;
  } else {
    usersPage.value = 1;
    usersHasMore.value = true;
    users.value = [];
  }
  loadData();
}

function setPostFilter(filter: number) {
  postFilter.value = filter;
  postsPage.value = 1;
  postsHasMore.value = true;
  postList.value = null;
  loadData();
}

async function loadData(fromLoadMore = false) {
  if (isLoading.value || isLoadingMore.value) return;

  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab and filter at the time of the request
  const currentActiveTab = activeTab.value;
  const currentPostFilter = postFilter.value;
  const currentSearchKeyword = searchKeyword.value;

  if (fromLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }

  // Ensure we have region info (cached after first fetch)
  await getCountry();

  try {
    if (activeTab.value == 'posts') {
      const showNsfw = userRegion.value ? (localStorage.getItem('allowSensitiveContent') == '1' ? 1 : 0) : undefined;
      const res = await api.searchPost({
        keyword: searchKeyword.value,
        type: postFilter.value,
        page: postsPage.value,
        limit: postsLimit.value,
        language: locale.value == 'zh' ? 'cn' : locale.value,
        show_nsfw: showNsfw,
      }) as any;

      // Check if this request is still the latest one
      if (requestId !== currentRequestId.value) {
        isLoading.value = false;
        isLoadingMore.value = false;
        return; // Skip processing this response as it's outdated
      }

      // Check if the tab or filter has changed while the request was in flight
      if (currentActiveTab !== activeTab.value || currentPostFilter !== postFilter.value || currentSearchKeyword !== searchKeyword.value) {
        isLoading.value = false;
        isLoadingMore.value = false;
        return; // Skip processing this response as the tab or filter has changed
      }

      if (res.code == 0 || res.code == 200) {
        const newPosts = (res.data?.data || []).map((item: any) => {
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
          author: {
            avatar: item.author?.avatar,
            nickname: item.author?.nickname || '',
            id: item.author?.id || 0
          },
          all_like: parseInt(item.all_like || "0"),
          isLiked: item.is_liked == 1 || false,
          is_nsfw: item.is_nsfw,
        };
        });

        // For initial search, replace the list instead of pushing
        if (fromLoadMore) {
          // For load more, push to the list
          if (!postList.value) {
            postList.value = [];
          }
          postList.value.push(...newPosts);
        } else {
          // For initial search, replace the list
          postList.value = newPosts;
        }

        const rawPostCount = res.data?.count || (res.data?.data || []).length;
        if (rawPostCount < postsLimit.value) {
          postsHasMore.value = false;
        } else {
          const totalPosts = Number(res.data?.allnums) || 0;
          postsHasMore.value = (postList.value ? postList.value.length : 0) < totalPosts;
        }

        postsPage.value++;

        // Update loading state immediately
        isLoading.value = false;
        isLoadingMore.value = false;

        // Wait for images to load before layout
        nextTick(() => {
          let loadedCount = 0;
          const total = newPosts.length;
          if (total === 0) {
            layoutWaterfall();
            return;
          }

          newPosts.forEach((post: Post) => {
            const img = new Image();
            img.src = post.cover;
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

        postList.value = [];
        isLoading.value = false;
        isLoadingMore.value = false;
      }

    } else {
      // Use real API for users search
      const res = await api.searchUserList(
        searchKeyword.value,
        usersPage.value,
        18
      ) as any;

      // Check if this request is still the latest one
      if (requestId !== currentRequestId.value) {
        isLoading.value = false;
        isLoadingMore.value = false;
        return; // Skip processing this response as it's outdated
      }

      // Check if the tab has changed while the request was in flight
      if (currentActiveTab !== activeTab.value || currentSearchKeyword !== searchKeyword.value) {
        isLoading.value = false;
        isLoadingMore.value = false;
        return; // Skip processing this response as the tab has changed
      }

      if (res.code === 0 || res.code === 200) {
        const userList = res.data?.data || [];
        if (usersPage.value === 1) {
          users.value = userList;
        } else {
          users.value = [...users.value, ...userList];
        }

        const rawUserCount = res.data?.count || (res.data?.data || []).length;
        if (rawUserCount < 18) {
          usersHasMore.value = false;
        } else {
          const totalUsers = Number(res.data?.allnums) || 0;
          usersHasMore.value = users.value.length < totalUsers;
        }

        usersPage.value++;

        isLoading.value = false;
        isLoadingMore.value = false;
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);

        isLoading.value = false;
        isLoadingMore.value = false;
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    toast(t('fail'));
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

async function loadMore() {
  if (isLoading.value || isLoadingMore.value) return;

  if ((activeTab.value === 'posts' && !postsHasMore.value) || (activeTab.value === 'users' && !usersHasMore.value)) {
    return;
  }

  await loadData(true);  // 传入 true 表示是 loadMore 调用
}

// Waterfall layout function
const layoutWaterfall = () => {
  if (!waterfallRef.value || !postList.value || postList.value.length === 0) return;

  // Flex layout will handle positioning automatically
  // No need for absolute positioning calculations
};

function goToDetail(postId: string | number) {
  // Save current post filter before navigating
  localStorage.setItem('searchPostFilter', postFilter.value.toString());
  // if (type === 2) {
  //   router.push(`/novel-detail?id=${postId}&type=5&keyword=${encodeURIComponent(searchKeyword.value || '')}`);
  // } else {
  //   router.push(`/detail?id=${postId}&type=5&keyword=${encodeURIComponent(searchKeyword.value || '')}`);
  // }
  router.push(`/detail?id=${postId}&type=5&keyword=${encodeURIComponent(searchKeyword.value || '')}`);
}

function goToUserHome(userId: number) {
  router.push(`/user-home?id=${userId}`);
}

async function toggleLike(post: Post) {
  // Check if user is logged in
  if (!checkLogin()) return;

  try {
    const postId = post.id;
    // Find the post in the postList
    const postIndex = postList.value?.findIndex(p => p.id === postId);
    if (postIndex === -1 || postIndex === undefined) return;

    const isCurrentlyLiked = post.isLiked;

    // Call the appropriate API first
    let res;
    if (isCurrentlyLiked) {
      // Unlike post
      res = await api.dislikePost({ post_id: postId }) as any;
    } else {
      // Like post
      res = await api.likePost({ post_id: postId }) as any;
    }

    // Check if API call was successful
    if (res.code === 0 || res.code === 200) {
      // Update the UI only after API success
      if (postList.value) {
        postList.value[postIndex].isLiked = !isCurrentlyLiked;
        postList.value[postIndex].all_like += isCurrentlyLiked ? -1 : 1;
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

async function toggleFollow(user: any) {
  // Check if user is logged in
  if (!checkLogin()) return;

  try {
    const userId = user.id;
    // Find the user in the users list
    const userIndex = users.value.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const isCurrentlyFollowing = user.is_followed;

    // Call the appropriate API first
    let res;
    if (isCurrentlyFollowing) {
      // Unfollow user
      res = await api.unfollow({ followed_id: userId }) as any;
    } else {
      // Follow user
      res = await api.follow({ followed_id: userId }) as any;
    }

    // Check if API call was successful
    if (res.code === 0 || res.code === 200) {
      // Update the UI only after API success
      users.value[userIndex].is_followed = !isCurrentlyFollowing;
      // Show success message
      toast(isCurrentlyFollowing ? t('search.unfollow') : t('search.followed'));
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    // Show error message if API call failed
    toast(t('search.followFailed'));
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

  // Restore last post filter if coming back from detail page
  try {
    const lastPostFilter = localStorage.getItem('searchPostFilter');
    if (lastPostFilter !== null) {
      const filterNum = parseInt(lastPostFilter, 10);
      if (!isNaN(filterNum)) {
        postFilter.value = filterNum;
      }
      localStorage.removeItem('searchPostFilter');
    }
  } catch (error) {
    console.error('Error loading last post filter:', error);
  }

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
            ((activeTab.value === 'posts' && postsHasMore.value) ||
             (activeTab.value === 'users' && usersHasMore.value))
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

  // Always load data even if there's no keyword
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", layoutWaterfall);

  // 清理 IntersectionObserver
  if (loadingSentinel.value && (loadingSentinel.value as any)._observer) {
    (loadingSentinel.value as any)._observer.disconnect();
  }
});

// Watch activeTab to trigger layout when switching to posts
watch(activeTab, (newVal) => {
  if (newVal === 'posts') {
    nextTick(() => {
      layoutWaterfall();
    });
  }
});

// Watch postList to trigger layout when data changes
watch(postList, () => {
  if (activeTab.value === 'posts' && postList.value && postList.value.length > 0) {
    nextTick(() => {
      layoutWaterfall();
    });
  }
});
</script>

<style lang="scss" scoped>
$ink: #161122;
$paper: #FFFDF7;
$cream: #FFFBF4;
$pink: #FF4D8D;
$muted: #9a93a4;
$sub: #5b5566;
$line: #e7e1d8;

.search-page {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: $cream;
}

.container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 1.2rem;

  @media (min-width: 768px) {
    padding: 0 1.6rem;
  }
}

.search-panel {
  background: $paper;
  border: 3px solid $ink;
  border-radius: 6px;
  padding: 2.4rem 1.8rem 3.2rem;
  box-shadow: 6px 6px 0 rgba(22,17,34,0.14);
  animation: sePanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;

  @media (min-width: 768px) {
    padding: 3.4rem 4rem 4.4rem;
  }
}

.search-bar {
  margin: 0 0 2rem;

  .search-input-wrap {
    position: relative;
    max-width: 100%;

    .search-input {
      width: 100%;
      height: 4.4rem;
      background: #fff;
      border: 2px solid $ink;
      border-radius: 999px;
      padding: 0 5rem 0 3.6rem;
      font-family: inherit;
      font-weight: 700;
      font-size: 1.3rem;
      color: $ink;
      outline: none;
      transition: box-shadow 0.18s;

      &::placeholder {
        color: $muted;
        font-weight: 700;
      }

      &:focus {
        box-shadow: 0 0 0 4px rgba(255,77,141,0.25);
      }
    }

    .search-icon {
      position: absolute;
      left: 1.2rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1.6rem;
      height: 1.6rem;
      color: $muted;
      pointer-events: none;
    }

    .search-btn {
      position: absolute;
      right: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      width: 3.6rem;
      height: 3.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      img {
        width: 1.8rem;
        height: 1.8rem;
      }
    }
  }
}

.search-results {
  .results-header {
    h2 {
      font-weight: 800;
      font-size: 3rem;
      color: $ink;
      margin-bottom: 0;
      letter-spacing: 0.02em;
      display: flex;
      align-items: flex-end;
      gap: 1.4rem;
      flex-wrap: wrap;

      span {
        font-weight: 800;
        background: #FFEFF5;
        border: 2.5px solid $ink;
        border-radius: 999px;
        padding: 0.4rem 1.5rem;
        font-size: 1.5rem;
        box-shadow: 2px 2px 0 $ink;
        animation: seChipIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
      }
    }

    .search-count {
      font-weight: 600;
      font-size: 1.4rem;
      color: $muted;
      margin-top: 0.8rem;
      margin-bottom: 2rem;
    }

    .result-tabs {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      background: #fff;
      border: 2.5px solid $ink;
      border-radius: 1.4rem;
      padding: 5px;
      margin-bottom: 2.6rem;

      .tab-item {
        font-weight: 800;
        font-size: 1.45rem;
        padding: 1rem 2rem;
        border-radius: 1rem;
        cursor: pointer;
        transition: background-color 0.16s, color 0.16s;
        color: $ink;
        background: transparent;

        &.active {
          background: $ink;
          color: #fff;
        }

        &:hover:not(.active) {
          background: $paper;
        }
      }
    }

    .post-filters {
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
      margin: 0 0 2rem;

      .filter-item {
        font-weight: 800;
        font-size: 1.3rem;
        padding: 0.8rem 1.6rem;
        border-radius: 999px;
        border: 2px solid $ink;
        cursor: pointer;
        transition: all 0.16s;
        background: #fff;
        color: $ink;

        &.active {
          background: $ink;
          color: #fff;
        }

        &:hover:not(.active) {
          background: $paper;
        }
      }
    }
  }
}

/* Grid Layout for Posts */
.posts-container {
  margin: 0;

  .waterfall {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.8rem;
    width: 100%;
    margin: 0 auto;

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }
  }
}

.content-item {
  cursor: pointer;
  overflow: hidden;
  break-inside: avoid;
  background: #fff;
  border: 2.5px solid $ink;
  border-radius: 1.6rem;
  box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
  animation: seCardIn 0.5s cubic-bezier(0.16,1,0.3,1) backwards;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 7px 8px 0 rgba(22,17,34,0.2);
  }

  .content-image {
    width: 100%;
    aspect-ratio: 3 / 4;
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
    }

    &:hover img {
      transform: scale(1.06);
    }

    .r18-overlay {
      position: absolute;
      top: 0;
      right: 0;
      width: 8rem;
      height: 8rem;
      background: linear-gradient(222deg, $pink 0%, rgba(255,77,141,0) 50%);
      border-radius: 0 1.6rem 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 0.6rem;

      .r18-text {
        font-size: 1.4rem;
        font-weight: 800;
        color: #FFFFFF;
        text-shadow: 0px 0px 8px rgba(0,0,0,0.18);
      }
    }

    .type-icon {
      position: absolute;
      top: 0.8rem;
      left: 0.8rem;
      z-index: 1;
      background: #FFC24B;
      border: 2px solid $ink;
      border-radius: 999px;
      padding: 0.3rem 1rem;
      font-weight: 800;
      font-size: 1.1rem;
      color: $ink;

      img {
        width: 3.2rem;
        height: 3.2rem;
        object-fit: contain;
      }
    }

    .play-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translateX(-50%) translateY(-42%);
      z-index: 1;

      img {
        width: 6rem;
        height: 6rem;
        object-fit: contain;
      }
    }

    .content-bottom {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 5rem;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0 1rem 1rem;
      border-radius: 0 0 1.6rem 1.6rem;
      background: linear-gradient(0deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
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
  }

  .content-info {
    padding: 1.4rem 1.5rem 1.5rem;

    .content-desc {
      font-weight: 800;
      font-size: 1.7rem;
      color: $ink;
      line-height: 1.35;
      min-height: 4.6rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .content-meta {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      margin-top: 1.1rem;

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
          border-radius: 999px;
          border: 2px solid $ink;
          object-fit: cover;
        }

        .author-name {
          font-weight: 600;
          font-size: 1.35rem;
          color: $muted;
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
        font-weight: 800;
        font-size: 1.5rem;
        color: $pink;

        span {
          font-weight: 800;
          font-size: 1.3rem;
          color: $muted;
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
  color: $muted;
  font-size: 1.4rem;
}

/* Users Grid */
.users-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.8rem;
  margin: 0;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.user-card {
  background: #fff;
  border: 2.5px solid $ink;
  border-radius: 1.6rem;
  padding: 2.2rem 1.8rem;
  text-align: center;
  cursor: pointer;
  box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
  animation: seCardIn 0.5s cubic-bezier(0.16,1,0.3,1) backwards;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 6px 8px 0 rgba(22,17,34,0.16);
  }

  .user-avatar {
    width: 7.8rem;
    height: 7.8rem;
    border-radius: 999px;
    border: 2.5px solid $ink;
    margin: 0 auto 1.2rem;
    object-fit: cover;
    box-shadow: 3px 3px 0 rgba(22,17,34,0.14);
  }

  .nickname {
    font-weight: 800;
    font-size: 1.6rem;
    color: $ink;
  }

  .fans-count {
    font-weight: 600;
    font-size: 1.2rem;
    color: $muted;
    margin-top: 0.2rem;
  }

  .card-bio {
    font-weight: 600;
    font-size: 1.2rem;
    color: $muted;
    line-height: 1.8rem;
    margin-top: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .follow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 9rem;
    height: 3.6rem;
    padding: 0 1.4rem;
    border-radius: 1.3rem;
    font-weight: 800;
    font-size: 1.3rem;
    cursor: pointer;
    background: linear-gradient(135deg, $pink, #FF7A45);
    color: #ffffff;
    border: none;
    box-shadow: 3px 3px 0 $ink;
    transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s;
    position: relative;
    overflow: hidden;
    margin-top: 0.9rem;

    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 $ink;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 $ink;
    }

    .hover-text {
      display: none;
    }

    &.followed {
      background: #fff;
      color: $muted;
      border: 2.5px solid $ink;
      box-shadow: 2px 2px 0 $ink;

      &:hover {
        color: $pink;
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 $ink;

        .btn-text {
          display: none;
        }

        .hover-text {
          display: inline;
        }
      }
    }
  }
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
    border: 0.4rem solid $line;
    border-top: 0.4rem solid $ink;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
  }

  p {
    font-size: 1.6rem;
    color: $muted;
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
    border: 0.4rem solid $line;
    border-top: 0.4rem solid $ink;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
  }

  p {
    font-size: 1.6rem;
    color: $muted;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes sePanelIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes seChipIn {
  from { opacity: 0; transform: scale(0.55) rotate(-8deg); }
  to { opacity: 1; transform: none; }
}

@keyframes seCardIn {
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to { opacity: 1; transform: none; }
}

/* Skeleton placeholder */
.se-skel {
  background: $line;
  border-radius: 1.6rem;
  animation: seSkelPulse 1.6s ease-in-out infinite;
}

@keyframes seSkelPulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

/* Responsive */
@media (max-width: 720px) {
  .container {
    padding: 0 1rem;
  }

  .search-panel {
    padding: 2rem 1.2rem 2.4rem;
  }

  .results-header h2 {
    font-size: 2.4rem;

    span {
      font-size: 1.3rem;
    }
  }

  .content-item .content-info .content-desc {
    font-size: 1.4rem;
    min-height: 3.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .search-panel, .content-item, .user-card {
    animation: none !important;
  }
  .content-item:hover, .user-card:hover {
    transform: none;
    box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
  }
  .content-item .content-image img {
    transition: none;
  }
  .content-item:hover .content-image img {
    transform: none;
  }
  .se-skel {
    animation: none !important;
    opacity: 0.7;
  }
}
</style>