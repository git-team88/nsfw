<template>
  <div class="search-page">
    <Header :cur="-1"></Header>

    <div class="container">
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
              v-for="post in postList"
              :key="post.id"
              ref="postCardRefs"
              @click="goToDetail(post.id)"
            >
              <div class="content-image">
                <img :src="post.cover || defaultCover" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultCover }" />
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
                <!-- Like Count in Top Right -->
                <div class="content-stats-top" @click.stop="toggleLike(post)">
                  <span>{{ formatNumber(post.like_count) }}</span>
                  <img :src="post.isLiked ? likeActive : like" alt="" />
                </div>
                <div class="content-bottom">
                  <!-- Update Time and Chapter Count -->
                  <div class="update-info">
                    <span v-if="post.latest_post_updated">{{ t(formatUpdateTime(post.latest_post_updated).key, formatUpdateTime(post.latest_post_updated).params || {}) }}</span>
                    <span v-if="post.latest_post_updated && post.latest_post_chapter_index" class="chapter-divider">|</span>
                    <span v-if="post.latest_post_chapter_index">
                      {{ post.type == '2' ? t('home.chapterFormat', { chapter: post.latest_post_chapter_index }) : t('home.episodeFormat', { episode: post.latest_post_chapter_index }) }}
                    </span>
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
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Users List -->
        <div v-else-if="activeTab === 'users'" class="users-list">
          <div
            v-for="user in users"
            :key="user.id"
            class="user-card"
          >
            <div class="card-top">
              <img :src="user.avatar || defaultAvatar" alt="Avatar" class="user-avatar" @click="goToUserHome(user.id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
              <div class="user-meta" @click="goToUserHome(user.id)">
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
import { formatUpdateTime } from '@/util/utils';

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
  author: {
    avatar: string;
    nickname: string;
    id: number;
  }
  like_count: number;
  isLiked: boolean;
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
const postsLimit = ref(10);
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
          cover: item.post?.cover || '',
          created_at: item.created_at,
          latest_post_updated: item.latest_post_updated,
          latest_post_chapter_index: item.latest_post_chapter_index,
          author: {
            avatar: item.author?.avatar,
            nickname: item.author?.nickname || '',
            id: item.author?.id || 0
          },
          like_count: parseInt(item.like_count || "0"),
          isLiked: item.is_liked == 1 || false,
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

        const totalPosts = Number(res.data?.allnums) || 0;
        const loadedPosts = postList.value ? postList.value.length : 0;
        postsHasMore.value = loadedPosts < totalPosts;

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

        // 计算是否还有更多数据
        const totalUsers = Number(res.data?.allnums) || 0;
        const loadedUsers = users.value.length;
        usersHasMore.value = loadedUsers < totalUsers;

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
        postList.value[postIndex].like_count += isCurrentlyLiked ? -1 : 1;
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
      if (res.res.countryCode != 'CN') {
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
.search-page {
  width: 100%;
  min-height: 100vh;
  padding: 12rem 0 0;
  background: #FFFFFF;
}

.container {
  max-width: 108rem;
  margin: 0 auto;
}

.search-bar {
  margin: 2rem 0 2.4rem;
  .search-input-wrap {
    position: relative;
    max-width: 100%;
    .search-input {
      width: 100%;
      height: 4.8rem;
      background: #F5F5F5;
      border: 1px solid #F5F5F5;
      border-radius: 0.8rem;
      padding: 0 6rem 0 1.2rem;
      font-family: inherit;
      font-size: 1.4rem;
      outline: none;
      &::placeholder {
        color: #99A1AF;
      }
      &:focus {
        border: 1px solid #fb64b6;
      }
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
      font-weight: normal;
      font-size: 1.6rem;
      color: #99A1AF;
      margin-bottom: 2.4rem;

      span{
        color: #6A7282;
      }
    }
    .result-tabs {
      display: flex;
      gap: 3rem;
      border-bottom: 1px solid #F5F5F5;
      .tab-item {
        padding: 0 0 2rem;
        font-size: 1.6rem;
        color: #6a7282;
        cursor: pointer;
        border-bottom: 2px solid transparent;

        &:hover{
          color: #101828;
        }

        &.active {
          font-weight: 500;
          color: #101828;
          border-bottom-color: #fb64b6;
        }
      }
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

    .content-stats-top {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      display: flex;
      align-items: center;
      z-index: 1;
      cursor: pointer;

      span {
        font-weight: 500;
        font-size: 1.4rem;
        text-shadow: 0px 0px 8px rgba(0,0,0,0.18);
        color: #FFFFFF;
      }

      img {
        width: 3.3rem;
        height: 3.1rem;
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
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
      overflow-wrap: anywhere;
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

/* Users List */
.users-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.8rem;
  margin: 1.6rem 0 2.4rem;
}

.user-card {
  padding: 1.8rem;
  border-radius: 0.8rem;
  transition: all 0.2s;
  cursor: pointer;
  &:hover {
    background: #ffffff;
    box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.06);
  }
  .card-top {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    margin-bottom: 1.2rem;
    .user-avatar {
      width: 4.8rem;
      height: 4.8rem;
      border-radius: 0.8rem;
      object-fit: cover;
    }
    .user-meta {
      flex: 1;
      .nickname {
        font-size: 1.4rem;
        font-weight: 500;
        color: #364153;
        margin-bottom: 0.6rem;
      }
      .fans-count {
        font-size: 1.2rem;
        color: #6a7282;
      }
    }
    .follow-btn {
      min-width: 9.8rem;
      height: 4rem;
      padding: 0 1.6rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;
      background: #fb64b6;
      color: #ffffff;
      position: relative;
      overflow: hidden;
      &:hover {
        position: relative;
        &::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }
      }
      .hover-text {
        display: none;
      }
      &.followed {
        background: #F5F5F5;
        color: #99A1AF;
        &:hover {
          position: relative;
          color: #fb64b6;

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
  .card-bio {
    height: 3.6rem;
    font-size: 1.2rem;
    color: #6a7282;
    line-height: 1.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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