<template>
  <div class="search-page">
    <Header :cur="-1"></Header>

    <div class="container">
      <!-- Search Bar -->
      <div class="search-bar">
        <div class="search-input-wrap">
          <input
            v-model="keyword"
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
            <span>[{{ keyword }}]</span>
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
          <!-- <div class="post-filters" v-if="activeTab === 'posts'">
            <div
              v-for="filter in postFilters"
              :key="filter.value"
              class="filter-item"
              :class="{ active: postFilter === filter.value }"
              @click="setPostFilter(filter.value)"
            >
              {{ filter.label }}
            </div>
          </div> -->
        </div>

        <!-- Posts Grid (Masonry Layout) -->
        <div v-if="activeTab === 'posts'" class="posts-container">
          <div
            class="waterfall"
            v-if="postList && postList.length > 0"
            ref="waterfallRef"
            :style="{ height: containerHeight + 'px' }"
          >
            <div
              class="content-item"
              v-for="post in postList"
              :key="post.id"
              :style="post.style"
              ref="postCardRefs"
              @click="goToDetail(post.id)"
            >
              <div class="content-image">
                <img :src="post.cover" alt="" />
                <!-- Video Play Icon -->
                <div v-if="post.type === 'video'" class="play-icon">
                  <img src="@/assets/images/detail/play.png" alt="" />
                </div>
              </div>
              <div class="content-info">
                <div class="content-desc" v-if="post.title || post.description">{{ post.title ? post.title : post.description ? post.description : '' }}</div>
                <div class="content-meta">
                  <div class="author-info" @click.stop="goToUserHome(post.author.id)">
                    <img :src="post.author.avatar" alt="" class="author-avatar" />
                    <span class="author-name">{{ post.author.nickname }}</span>
                  </div>
                  <div class="content-stats" @click.stop="toggleLike(post)">
                    <img :src="post.isLiked ? likeActive : like" alt="" />
                    <span>{{ formatNumber(post.like_count) }}</span>
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
              <img :src="user.avatar" alt="User Avatar" class="user-avatar" @click="goToUserHome(user.id)" />
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
                  t('search.unfollowed')
                }}</span>
              </button>
            </div>
            <div class="card-bio">{{ user.page?.page_desc || '' }}</div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading && !postList" class="loading-state">
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

import likeActive from '@/assets/images/detail/like_active.png';
import like from '@/assets/images/detail/like.png';

// Types
interface Post {
  id: number;
  type: string;
  title: string;
  description: string;
  cover: string;
  time: string;
  style?: CSSProperties;
  author: {
    avatar: string;
    nickname: string;
    id: number;
  }
  like_count: number;
  isLiked: boolean;
}

// State
const keyword = ref(route.query.keyword as string || '');
const activeTab = ref(route.query.type === 'user' ? 'users' : 'posts');
const postFilter = ref('all');

// Tabs and filters data
const tabs = ref([
  { value: 'posts', label: t('search.posts') },
  { value: 'users', label: t('search.users') }
]);

const postFilters = ref([
  { value: 'all', label: t('search.all') },
  { value: 'video', label: t('search.video') },
  { value: 'image', label: t('search.image') },
  { value: 'article', label: t('search.article') }
]);

// Refs for waterfall layout
const waterfallRef = ref<HTMLElement | null>(null);
const postCardRefs = ref<HTMLElement[]>([]);
const containerHeight = ref(0);
const loadingSentinel = ref<HTMLElement | null>(null);

// Posts
const postList = ref<Post[] | null>(null);
const postsPage = ref(1);
const postsHasMore = ref(true);

// Users
const users = ref<any[]>([]);
const usersPage = ref(1);
const usersHasMore = ref(true);

// Loading
const isLoading = ref(false);
const isLoadingMore = ref(false);

// Methods
function performSearch() {
  // Update URL with the new keyword
  router.replace({
    path: '/search',
    query: {
      keyword: keyword.value,
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
      keyword: keyword.value,
      type: tab === 'users' ? 'user' : 'post'
    }
  });

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

function setPostFilter(filter: string) {
  postFilter.value = filter;
  postsPage.value = 1;
  postsHasMore.value = true;
  postList.value = null;
  loadData();
}

async function loadData(fromLoadMore = false) {
  if (isLoading.value || isLoadingMore.value) return;

  if (fromLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }

  try {
    if (activeTab.value === 'posts') {
      const res = await api.searchPost({
        keyword: keyword.value,
        type: postFilter.value === 'all' ? '' : postFilter.value,
        page: postsPage.value,
        limit: 10
      }) as unknown as { code: number; msg: string; msg_jp: string; data?: any };

      if (res.code === 0 || res.code === 200) {
        const newPosts = (res.data?.data || []).map((item: any) => {
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
            type: item.type === '1' ? 'image' : item.type === '2' ? 'article' : 'video',
            title: item.title || '',
            description: item.content || '',
            cover: item.cover || '',
            time: formatTime(item.created_at),
            author: {
              avatar: item.author?.avatar,
              nickname: item.author?.nickname || '',
              id: item.author?.id || 0
            },
            like_count: parseInt(item.like_count || "0"),
            isLiked: item.is_liked == 1 || false,
            style: {
              position: "absolute",
              left: "0",
              top: "0",
            } as CSSProperties,
          };
        });

        if (!postList.value) {
          postList.value = [];
        }
        postList.value.push(...newPosts);

        const totalPosts = Number(res.data?.allnums) || 0;
        const loadedPosts = postList.value.length;
        postsHasMore.value = loadedPosts < totalPosts;

        postsPage.value++;

        // Wait for images to load before layout
        nextTick(() => {
          let loadedCount = 0;
          const total = newPosts.length;
          if (total === 0) {
            layoutWaterfall();
            isLoading.value = false;
            isLoadingMore.value = false;
            return;
          }

          newPosts.forEach((post: Post) => {
            const img = new Image();
            img.src = post.cover;
            img.onload = img.onerror = () => {
              loadedCount++;
              if (loadedCount === total) {
                layoutWaterfall();
                isLoading.value = false;
                isLoadingMore.value = false;
              }
            };
          });
        });
      } else {
        isLoading.value = false;
        isLoadingMore.value = false;
      }

    } else {
      // Use real API for users search
      const res = await api.searchUserList(
        keyword.value,
        usersPage.value,
        18
      ) as unknown as { code: number; msg: string; msg_jp: string; data?: any };

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

        console.log('🔄 Search: users 数据加载完成', {
          newCount: userList.length,
          totalLoaded: loadedUsers,
          totalAvailable: totalUsers,
          hasMore: usersHasMore.value,
          nextPage: usersPage.value
        });

        isLoading.value = false;
        isLoadingMore.value = false;
      } else {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    toast(t('search.searchFailed'));
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

  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const cardWidthRem = 25.8;
  const gapRem = 1.6;
  const cols = 4;

  // ✅ 改为从左到右顺序排列，而不是找最短列插入
  // 行高度数组，记录每一行的最大高度
  const rowHeights: number[] = [];
  let currentRow = 0;
  let currentRowHeight = 0;

  // 先隐藏所有卡片，避免布局前显示在错误位置
  if (postList.value) {
    postList.value.forEach(post => {
      if (!post.style) post.style = {};
      post.style.opacity = 0;
    });
  }

  // Use a small delay to ensure DOM is ready
  setTimeout(() => {
    const cards = postCardRefs.value;
    if (!cards || cards.length === 0) return;

    // Add null check
    if (!postList.value) return;

    postList.value.forEach((post, index) => {
      const cardEl = cards[index];
      if (!cardEl) return;

      // 计算当前卡片在第几列（从 0 开始）
      const colIndex = index % cols;

      // 如果是第一列，说明开始新行
      if (colIndex === 0) {
        // 如果不是第一行，先保存上一行的高度
        if (index > 0) {
          rowHeights.push(currentRowHeight);
        }
        // 计算新行的起始位置（所有之前行的高度之和）
        currentRow = Math.floor(index / cols);
        currentRowHeight = 0;
      }

      // 计算位置
      const leftRem = colIndex * (cardWidthRem + gapRem);
      const prevRowsHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      const topRem = prevRowsHeight / rootFontSize;

      post.style = {
        position: "absolute",
        left: `${leftRem}rem`,
        top: `${topRem}rem`,
        opacity: 1, // ✅ 布局完成后显示
      };

      // 更新当前行的最大高度
      const cardHeight = cardEl.offsetHeight + gapRem * rootFontSize;
      if (cardHeight > currentRowHeight) {
        currentRowHeight = cardHeight;
      }
    });

    // 保存最后一行的高度
    if (postList.value.length > 0) {
      rowHeights.push(currentRowHeight);
    }

    // 容器高度 = 所有行高度之和
    containerHeight.value = rowHeights.reduce((sum, h) => sum + h, 0);
  }, 50);
};

function goToDetail(postId: number) {
  router.push(`/detail?id=${postId}`);
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
      // Show error message if API call failed
      toast(t('common.fail'));
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
      toast(isCurrentlyFollowing ? t('search.unfollowed') : t('search.followed'));
    } else {
      // Show error message if API call failed
      toast(t('common.fail'));
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

// Lifecycle
onMounted(async () => {
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
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
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
      background: rgba(255,255,255,0.8);
      border: 1px solid rgba(251,100,182,0.2);
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
      color: #6A7282;
      margin-bottom: 2.4rem;

      span{
        color: #fb64b6;
      }
    }
    .result-tabs {
      display: flex;
      gap: 3rem;
      border-bottom: 1px solid rgba(251,100,182,0.2);
      .tab-item {
        padding: 0 0 2rem;
        font-size: 1.6rem;
        color: #6a7282;
        cursor: pointer;
        border-bottom: 2px solid transparent;

        &.active {
          font-weight: 500;
          color: #fb64b6;
          border-bottom-color: #fb64b6;
        }
      }
    }
    .post-filters {
      display: flex;
      gap: 3rem;
      height: 100%;
      margin-top: 1.6rem;
      .filter-item {
        display: flex;
        align-items: center;
        padding: 0.6rem 1.6rem;
        border: 1px solid transparent;
        font-size: 1.4rem;
        border-radius: 0.6rem;
        color: #6a7282;
        cursor: pointer;
        position: relative;

        &:hover{
          border-color: rgba(251,100,182,0.2);
        }

        &.active {
          border-color: #FB64B6;
          background: rgba(251,100,182,0.12);
          color: #FB64B6;
        }
      }
    }
  }
}

/* Masonry Layout for Posts */
.posts-container {
  margin: 2.4rem 0;
  .waterfall {
    position: relative;
    width: 100%;
    min-height: 40rem;
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
  }
  .content-info {
    padding: 1.2rem 0 0;

    .content-desc {
      font-size: 1.4rem;
      color: #101828;
      line-height: 2rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-all;
    }

    .content-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.2rem;

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
          color: #6A7282;
        }
      }

      .content-stats {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        span {
          font-size: 1.2rem;
          color: #6a7282;
        }

        img{
          width: 1.8rem;
          height: 1.8rem;
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
    .card-top {
      .user-meta {
        .nickname {
          color: #fb64b6;
        }
      }
    }
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
        font-weight: 600;
        color: #101828;
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
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
        }
      }
      .hover-text {
        display: none;
      }
      &.followed {
        background: rgba(251, 100, 182, 0.06);
        border: 1px solid rgba(251, 100, 182, 0.2);
        color: rgba(251, 100, 182, 0.5);
        &:hover {
          position: relative;
          border: 1px solid #fb64b6;
          background: #ffffff;
          color: #fb64b6;
          &::after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(251, 100, 182, 0.06);
          }
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
    width: 50px;
    height: 50px;
    border: 4px solid rgba(251, 100, 182, 0.1);
    border-radius: 50%;
    border-top-color: #fb64b6;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 2rem;
    &.small {
      width: 30px;
      height: 30px;
      border-width: 3px;
    }
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
    width: 30px;
    height: 30px;
    border: 3px solid rgba(251, 100, 182, 0.1);
    border-radius: 50%;
    border-top-color: #fb64b6;
    animation: spin 1s ease-in-out infinite;
  }
  p {
    font-size: 1.4rem;
    color: #6a7282;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>