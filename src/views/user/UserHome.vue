<template>
  <div class="user-homepage">
    <Header :cur="-1"></Header>

    <!-- Top Banner -->
    <div class="home-bg">
      <img :src="userInfo.headerImage || defaultHeaderImg" alt="" />
    </div>

    <div class="main-content">
      <!-- User Info Card -->
      <div class="user-info-card">
        <div class="info-left">
          <img class="avatar" :src="userInfo.avatar || defaultAvatar" alt="avatar" />
        </div>

        <div class="info-right">
          <div class="text-inner">
            <div class="text-info">
              <div class="name-row">
                <span class="nickname">{{ userInfo.nickname }}</span>
              </div>
              <div class="id-row">{{ t("userHome.info.id") }}: {{ userInfo.id }}</div>
            </div>

            <div class="actions">
              <template v-if="isSelf">
                <button class="btn edit" @click="router.push('/user-profile-edit')">
                  {{ t("userHome.editProfile") }}
                </button>
              </template>
              <template v-else>
                <button
                  class="btn follow"
                  :class="{ followed: userInfo.is_follow == 1 }"
                  @click="toggleFollow"
                >
                  {{ userInfo.is_follow == 1 ? t("detail.followed") : t("detail.follow") }}
                </button>
                <button
                  class="btn subscribe"
                  :class="{ subscribed: userInfo.is_subscribe == 1 }"
                  :disabled="userInfo.is_subscribe == 1"
                  v-if="hasActiveSubscriptionPlans"
                  @click="goSubscribe()"
                >
                  {{ userInfo.is_subscribe == 1 ? t("userHome.subscribed") : t("userHome.subscribePrice", { price: getSubscriptionPrice() }) }}
                </button>
              </template>
              <button class="btn share" @click="sharePage">
                <img src="@/assets/images/user/share.png" alt="" />
                {{ t("userHome.share") }}
              </button>
              <div class="more-menu-wrap" ref="moreMenuRef" v-if="!isSelf">
                <img
                  src="@/assets/images/detail/menu.png"
                  alt=""
                  @click="showMoreMenu = !showMoreMenu"
                />

                <div class="dropdown-menu" v-if="showMoreMenu">
                  <div class="menu-item" @click="reportUser">{{ t("userHome.report") }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="desc-box">
            <div class="desc-text" :class="{ collapsed: !isDescExpanded }">
              {{ userInfo.description }}
            </div>
            <div
              class="expand-btn"
              :class="isDescExpanded ? 'hide' : ''"
              v-if="showExpandBtn"
              @click="isDescExpanded = !isDescExpanded"
            >
              <img src="@/assets/images/detail/show.png" v-if="!isDescExpanded" />
              <img src="@/assets/images/detail/hide.png" v-else />
              <span>{{ isDescExpanded ? t("userHome.showLess") : t("userHome.showMore") }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div
          class="posts-title"
          :class="{ active: viewMode === 'posts' }"
          @click="goToPosts"
        >
          {{ t("userHome.posts") }} ({{ stats.all }})
        </div>
        <div class="stats-nums">
          <div
            class="stat-item"
            :class="{ active: viewMode === 'follow' && followTab === 'following' }"
            @click="showFollowList('following')"
          >
            <span class="label">{{ t("userHome.following") }}:</span>
            <span class="val">{{ formatNumber(userInfo.following) }}</span>
          </div>
          <div
            class="stat-item"
            :class="{ active: viewMode === 'follow' && followTab === 'fans' }"
            @click="showFollowList('fans')"
          >
            <span class="label">{{ t("userHome.fans") }}:</span>
            <span class="val">{{ formatNumber(userInfo.fans) }}</span>
          </div>
          <div class="stat-item" style="cursor: default">
            <span class="label">{{ t("userHome.likes") }}:</span>
            <span class="val">{{ formatNumber(userInfo.likes) }}</span>
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Posts View -->
        <template v-if="viewMode === 'posts'">
          <!-- Filters & Tabs -->
          <div class="filter-bar">
            <!-- <div class="tabs">
              <div
                v-for="tab in tabs"
                :key="tab.key"
                class="tab-item"
                :class="{ active: currentTab === tab.key }"
                @click="currentTab = tab.key"
              >
                {{ tab.label }}({{ tab.count }})
              </div>
            </div> -->

            <div class="filters">
              <DateRangePicker
                v-model="dateRange"
                :start-date="getStartDate()"
                :end-date="getEndDate()"
                theme="pink"
                class="custom-date-picker"
                @change="onDateChange"
              />
              <div class="search-box">
                <input
                  type="text"
                  v-model="searchKeyword"
                  :placeholder="t('userHome.filter.search')"
                  @keyup.enter="doSearch"
                />

                <img class="search-icon" src="@/assets/images/user/search.png" alt="" @click="doSearch" />
              </div>
            </div>
          </div>

          <!-- Waterfall List -->
          <div class="posts-container">
            <div
                class="waterfall"
                v-if="postList && postList.length > 0"
                ref="waterfallRef"
                :style="{ height: containerHeight + 'px' }"
              >
                <div
                  class="post-card"
                  v-for="post in postList"
                  :key="post.id"
                  :style="post.style"
                  ref="postCardRefs"
                >
                <div class="card-cover" @click="goDetail(post.id)">
                  <img :src="post.cover" alt="" class="cover-img" />
                  <div class="video-overlay" v-if="post.type === 'video'">
                    <img src="@/assets/images/detail/play.png" alt="" />
                  </div>
                  <div class="pinned-tag" v-if="post.isPinned">
                    {{ t("userHome.card.pinned") }}
                  </div>
                </div>
                <div class="card-info">
                  <div class="card-desc" v-if="post.title || post.description">{{ post.title ? post.title : post.description ? post.description : '' }}</div>
                  <div class="card-footer">
                    <span class="time">{{ post.time }}</span>
                    <div
                      class="more-btn-wrap"
                      :ref="(el) => setCardMenuRef(el, post.id)"
                      v-if="isSelf"
                    >
                      <img
                        src="@/assets/images/detail/menu.png"
                        @click.stop="toggleCardMenu(post.id, $event)"
                      />
                      <div
                        class="dropdown-menu"
                        v-if="activeCardMenuId === post.id"
                        :class="dropdownPos"
                      >
                        <div class="menu-item" v-if="post.isPinned" @click="unpinPost(post)">
                          {{ t("userHome.card.unpinned") }}
                        </div>
                        <div class="menu-item" v-else @click="pinPost(post)">
                          {{ t("userHome.card.pin") }}
                        </div>
                        <div class="menu-item" @click="editPost(post)">
                          {{ t("userHome.card.edit") }}
                        </div>
                        <div class="menu-item delete" @click="deletePost(post)">
                          {{ t("userHome.card.delete") }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <EmptyState v-if="(postList && postList.length == 0) && !loading" />

            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t("userHome.loading") }}</div>
            </div>

            <!-- Infinite Scroll Sentinel -->
            <div ref="loadingSentinel" style="height: 1px; margin-top: 20px;"></div>
          </div>
        </template>

        <!-- Follow/Fans List View -->
        <template v-else>
          <div class="filter-bar cur">
            <div class="tabs">
              <div
                v-for="tab in [{ key: 'following', label: t('userHome.tabs.following') }, { key: 'fans', label: t('userHome.tabs.fans') }]"
                :key="tab.key"
                class="tab-item"
                :class="{ active: followTab === tab.key }"
                @click="showFollowList(tab.key as 'following' | 'fans')"
              >
                {{ tab.label }}
              </div>
            </div>
          </div>

          <div class="follow-container">
            <div class="privacy-hidden" v-if="isPrivacyHidden">
              <img src="@/assets/images/user/hide.png" class="hide-icon" />
              <p>{{ t("userHome.privacy.hidden") }}</p>
            </div>
            <template v-else>
              <div class="loading-state" v-if="loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">{{ t("userHome.loading") }}</div>
              </div>

              <div v-else>
                <div class="follow-list" v-if="followList.length > 0">
                  <div class="follow-card" v-for="user in followList" :key="user.id">
                    <div class="card-top">
                      <img :src="user.avatar || defaultAvatar" class="user-avatar" @click="goUserHome(user.id)" />
                      <div class="user-meta">
                        <div class="nickname">{{ user.nickname }}</div>
                        <div class="fans-count">
                          {{ t("userHome.followList.totalFans", { num: formatNumber(user.fans) }) }}
                        </div>
                      </div>
                      <button
                        v-if="String(user.id) !== uid"
                        class="follow-btn"
                        :class="{ followed: user.isFollowed }"
                        @click="toggleListFollow(user)"
                      >
                        <span class="btn-text">{{
                          user.isFollowed
                            ? t("userHome.followList.following")
                            : t("userHome.followList.follow")
                        }}</span>
                        <span class="hover-text" v-if="user.isFollowed">{{
                          t("userHome.followList.unfollow")
                        }}</span>
                      </button>
                    </div>
                    <div class="card-bio">{{ user.bio }}</div>
                  </div>
                </div>

                <EmptyState v-if="followList.length == 0" />

                <div class="pagination-wrap" v-if="followTotal > 12">
                  <Pagination
                    v-model="followPage"
                    :total="followTotal"
                    :pageSize="12"
                    theme="pink"
                    @update:modelValue="handleFollowPageChange"
                  />
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- Pin Limit Modal -->
    <div class="pin-modal-overlay" v-if="showPinLimitModal">
      <div class="pin-modal">
        <img
          src="@/assets/images/base/close.png"
          class="close-icon"
          @click="showPinLimitModal = false"
        />

        <div class="modal-header">
          <div class="title">{{ t("userHome.card.limitTitle") }}</div>
        </div>
        <div class="modal-desc">{{ t("userHome.card.limitDesc") }}</div>

        <div class="pinned-list">
          <div
            class="pinned-item"
            v-for="item in pinnedPosts"
            :key="item.id"
            :class="{ selected: selectedReplaceId === item.id }"
            @click="selectedReplaceId = item.id"
          >
            <img :src="item.cover" class="item-cover" />
            <div class="item-title">{{ item.title }}</div>
          </div>
        </div>

        <button class="confirm-btn" :disabled="!selectedReplaceId" @click="confirmReplacePin">
          {{ t("userHome.card.confirm") }}
        </button>
      </div>
    </div>

    <!-- Custom Toast -->
    <CustomToast :visible="toastShow" :message="toastMsg" :icon="toastIcon" :theme="toastTheme" />

    <ReportModal
      v-if="reportTarget"
      v-model:visible="reportModalVisible"
      :title="t('report.userTitle')"
      :options="userReportOptions"
      :targetType="reportTarget"
      @submit="handleReportSubmit"
    />
  </div>
</template>

<script setup lang="ts" name="UserHome">
import Header from "@/components/Header.vue";
import Pagination from "@/components/Pagination.vue";
import EmptyState from "@/components/EmptyState.vue";
import ReportModal from "@/components/ReportModal.vue";
import CustomToast from "@/components/CustomToast.vue";
import DateRangePicker from "@/components/DateRangePicker.vue";
import defaultHeaderImg from "@/assets/images/user/pic.png";
import successIcon from "@/assets/images/user/success.png";
import defaultAvatar from "@/assets/images/base/avatar.png";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
  type CSSProperties,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import { useRoute } from "vue-router";
import api from "@/api/index";

// Check if user is logged in
function checkLogin() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }
  return true;
}

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

const uid = localStorage.getItem('uid');

interface Post {
  id: number;
  type: string;
  title: string;
  description: string;
  cover: string;
  time: string;
  isPinned?: boolean;
  is_top?: string;
  style?: CSSProperties;
}

// Subscription Plan Interface
interface SubscriptionPlan {
  price: string;
  id?: number;
  name?: string;
  description?: string;
}

// User Info Interface
interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  headerImage: string;
  is_follow: number;
  is_subscribe: number;
  subscribe_price: string;
  description: string;
  following: number;
  fans: number;
  likes: number;
  subPrice: string;
  subscription_plans: SubscriptionPlan[] | SubscriptionPlan | null;
}

// User Info
const userInfo = ref<UserInfo>({
  id: "",
  nickname: "",
  avatar: "",
  headerImage: "",
  is_follow: 0,
  is_subscribe: 0,
  subscribe_price: "",
  description: "",
  following: 0,
  fans: 0,
  likes: 0,
  subPrice: "",
  subscription_plans: null,
});

const reportTarget = ref<{ type: string; id: number | string } | null>(null);

// Loading state for user info
const loadingUserInfo = ref(false);

// Check subscription status from query
if (route.query.subscribed === "1") {
  userInfo.value.subPrice = "0"; // Or show different status
}

const stats = ref({
  all: 0,
  video: 0,
  image: 0,
  article: 0,
});

const isDescExpanded = ref(false);
const showExpandBtn = computed(() => userInfo.value.description.length > 100); // Simple check
const showMoreMenu = ref(false);

const hasActiveSubscriptionPlans = computed(() => {
  const plans = userInfo.value.subscription_plans;
  if (!plans) return false;

  if (Array.isArray(plans)) {
    return plans.length > 0 && plans.some((plan: SubscriptionPlan) => plan.price !== '0');
  } else {
    return plans.price !== '0';
  }
});

function getSubscriptionPrice() {
  const plans = userInfo.value.subscription_plans;
  if (!plans) return '0';

  if (Array.isArray(plans) && plans.length > 0) {
    // If it's an array, return the first plan's price
    return plans[0].price || '0';
  } else {
    // If it's an object, return its price
    return (plans as SubscriptionPlan).price || '0';
  }
}

const moreMenuRef = ref<HTMLElement | null>(null);

const isSelf = computed(() => {
  const localUid = localStorage.getItem("uid");
  return localUid === userInfo.value.id;
});

const currentTab = ref("all");
const dateRange = ref({ start: getStartDate(), end: getEndDate() });
const searchKeyword = ref("");

// Tabs for filter-bar
const tabs = ref([
  { key: 'all', label: t('userHome.tabs.all'), count: computed(() => stats.value.all) },
  { key: 'video', label: t('userHome.tabs.video'), count: computed(() => stats.value.video) },
  { key: 'image', label: t('userHome.tabs.image'), count: computed(() => stats.value.image) },
  { key: 'article', label: t('userHome.tabs.article'), count: computed(() => stats.value.article) }
]);

const postList = ref<Post[] | null>(null);
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);
const loadingSentinel = ref<HTMLElement | null>(null);

const waterfallRef = ref<HTMLElement | null>(null);
const postCardRefs = ref<HTMLElement[]>([]);
const containerHeight = ref(0);

const activeCardMenuId = ref<string | number | null>(null);
const cardMenuRefs = new Map<string | number, HTMLElement>();
const dropdownPos = ref("bottom");

const showPinLimitModal = ref(false);
const selectedReplaceId = ref<number | null>(null);
const pendingPinPost = ref<Post | null>(null);

const reportModalVisible = ref(false);
const userReportOptions = computed(() => [
  { label: t("report.reasons.fake"), value: "Fake Sales" },
  { label: t("report.reasons.attack"), value: "Abusive Attack" },
  { label: t("report.reasons.scam"), value: "Scam Information" },
  { label: t("report.reasons.black"), value: "Black/Grey Market Account" },
  { label: t("report.reasons.minor"), value: "Involving Minors" },
  { label: t("report.reasons.porn"), value: "Pornographic & Obscene" },
  { label: t("report.reasons.impersonation"), value: "Impersonation" },
  { label: t("report.reasons.violence"), value: "Cyber Violence" },
  { label: t("report.reasons.other"), value: "Other" },
]);

interface FollowUser {
  id: number;
  nickname: string;
  avatar: string;
  fans: number;
  isFollowed: boolean;
  bio: string;
}

const viewMode = ref<"posts" | "follow">("posts");
const followTab = ref<"following" | "fans">("following");
const followList = ref<FollowUser[]>([]);
const followPage = ref(1);
const followTotal = ref(0);
const isPrivacyHidden = ref(false); // Mock privacy status

const toastShow = ref(false);
const toastMsg = ref("");
const toastIcon = ref(successIcon);
const toastTheme = ref("blue");
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// Fetch user info using authorInfo API
async function fetchUserInfo() {
  let authorId = route.query.id;
  // Ensure authorId is a string
  if (Array.isArray(authorId)) {
    authorId = authorId[0];
  }
  if (!authorId) return;

  loadingUserInfo.value = true;
  try {
    const res = await api.authorInfo(authorId);
    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 200 || data.code === 0) {
      const subPrice = data.data?.sub_price || '';
      userInfo.value = {
        id: data.data?.user?.id || '',
        nickname: data.data?.user?.nickname || '',
        avatar: data.data?.user?.avatar || '',
        headerImage: data.data?.user_page?.page_banner || '',
        is_follow: data.data?.is_follow,
        is_subscribe: data.data?.is_subscribe,
        subscribe_price: data.data?.subscribe_price,
        subscription_plans:data.data?.subscription_plans || null,
        description: data.data?.user_page?.page_desc || '',
        following: parseInt(data.data?.user?.following_count || '0'),
        fans: parseInt(data.data?.user?.follower_count || '0'),
        likes: parseInt(data.data?.total_like_count || '0'),
        subPrice: subPrice,
      };

    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  } finally {
    loadingUserInfo.value = false;
  }
}

function showToast(msg: string, icon = successIcon) {
  toastMsg.value = msg;
  toastIcon.value = icon;
  toastShow.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastShow.value = false;
  }, 3000);
}

const pinnedPosts = computed(() => {
  return postList.value ? postList.value.filter((p) => p.isPinned) : [];
});

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
        const prevRowsHeight = rowHeights.reduce((sum, h) => sum + h, 0);
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
        width: `${cardWidthRem}rem`,
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

// Lifecycle
onMounted(async () => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", layoutWaterfall);

  // First fetch user info
  await fetchUserInfo();

  // Check URL for tab parameter and switch to corresponding tab
  const tabParam = route.query.tab;
  if (tabParam) {
    const tab = parseInt(tabParam as string);
    switch (tab) {
      case 1:
        goToPosts();
        break;
      case 2:
        showFollowList('following');
        break;
      case 3:
        showFollowList('fans');
        break;
    }
  } else {
    // Default to posts
    loadPosts(true);
  }

  // Intersection Observer for infinite scroll
  // 使用 nextTick 确保 DOM 已渲染
  nextTick(() => {
    if (loadingSentinel.value) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            !loading.value &&
            !noMore.value &&
            viewMode.value === "posts"
          ) {
            loadPosts();
          }
        },
        {
          rootMargin: '100px', // 提前100px触发
          threshold: 0.1
        }
      );
      observer.observe(loadingSentinel.value);

      // 保存 observer 以便清理
      (loadingSentinel.value as any)._observer = observer;
    }
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", layoutWaterfall);

  // 清理 IntersectionObserver
  if (loadingSentinel.value && (loadingSentinel.value as any)._observer) {
    (loadingSentinel.value as any)._observer.disconnect();
  }
});

watch(viewMode, (newVal) => {
  if (newVal === "posts") {
    layoutWaterfall();
  }
});

watch(currentTab, () => {
  if (viewMode.value === 'posts') {
    loadPosts(true);
  }
});

// Watch for route changes to update tab
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    const tab = parseInt(newTab as string);
    switch (tab) {
      case 1:
        goToPosts();
        break;
      case 2:
        showFollowList('following');
        break;
      case 3:
        showFollowList('fans');
        break;
    }
  }
});

// Watch for route query id changes to fetch new user data
watch(() => route.query.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Reset states
    userInfo.value = {
      id: "",
      nickname: "",
      avatar: "",
      headerImage: "",
      is_follow: 0,
      is_subscribe: 0,
      subscribe_price: "",
      description: "",
      following: 0,
      fans: 0,
      likes: 0,
      subPrice: "",
      subscription_plans: null,
    };
    postList.value = null;
    followList.value = [];
    loading.value = false;
    noMore.value = false;
    page.value = 1;
    followPage.value = 1;

    // Fetch new user info and data
    await fetchUserInfo();

    // Check URL for tab parameter and switch to corresponding tab
    const tabParam = route.query.tab;
    if (tabParam) {
      const tab = parseInt(tabParam as string);
      switch (tab) {
        case 1:
          goToPosts();
          break;
        case 2:
          showFollowList('following');
          break;
        case 3:
          showFollowList('fans');
          break;
      }
    } else {
      // Default to posts
      loadPosts(true);
    }
  }
});

// Methods
function formatNumber(num: number) {
  if (num >= 10000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

// Get start date (6 days ago)
function getStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return date.toISOString().split('T')[0];
}

// Get end date (today)
function getEndDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function showFollowList(tab: "following" | "fans") {
  viewMode.value = "follow";
  followTab.value = tab;
  fetchFollowList(true);

  const tabNum = tab === 'following' ? 2 : 3;
  const newQuery = { ...route.query };

  // Only update tab parameter if it already exists in the query
  if (route.query.tab) {
    newQuery.tab = tabNum.toString();
  }

  router.replace({
    path: "/user-home",
    query: newQuery,
  });
}

function goToPosts() {
  viewMode.value = "posts";
  currentTab.value = "all";
  loadPosts(true);

  // Update URL with tab parameter
  router.replace({
    path: "/user-home",
    query: {
      ...route.query,
      tab: "1"
    },
  });
}

async function fetchFollowList(reset = false) {
  if (reset) followPage.value = 1;

  let authorId = route.query.id;
  // Ensure authorId is a string
  if (Array.isArray(authorId)) {
    authorId = authorId[0];
  }
  if (!authorId) return;

  loading.value = true;

  try {
    let res;
    if (followTab.value === 'following') {
      res = await api.authorFollowList(followPage.value, 12, authorId);
    } else {
      res = await api.authorFansList(followPage.value, 12, authorId);
    }

    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 200 || data.code === 0) {
      const listData = data.data?.data || data.data?.list || [];

      followList.value = listData.map((item: any) => {
        if (followTab.value === 'fans') {
          return {
            id: item.follower_id || item.user_info?.id || '',
            nickname: item.user_info?.nickname || '',
            avatar: item.user_info?.avatar || '',
            fans: item.follow_count || 0,
            isFollowed: item.is_followed == 1 || false,
            bio: item.profile_info?.page_desc || '',
          };
        } else {
          return {
            id: item.followed_id || item.user_info?.id || '',
            nickname: item.user_info?.nickname || '',
            avatar: item.user_info?.avatar || '',
            fans: item.follower_count || 0,
            isFollowed: item.is_followed == 1 || false,
            bio: item.profile_info?.page_desc || '',
          };
        }
      });
      followTotal.value = data.data?.allnums || data.data?.total || 0;
    } else if (data.code === 33003) {
      isPrivacyHidden.value = true;
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleFollowPageChange() {
  fetchFollowList();
}

async function toggleListFollow(user: FollowUser) {
  if (!checkLogin()) return;

  try {
    const data = {
      followed_id: user.id
    };

    if (user.isFollowed) {
      const res = await api.unfollow(data);
      const response = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
      if (response.code === 200 || response.code === 0) {
        await fetchFollowList(true);
        toast(t('success'));
      }
    } else {
      const res = await api.follow(data);
      const response = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
      if (response.code === 200 || response.code === 0) {
        user.isFollowed = true;
        toast(t('success'));
      }
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}

async function toggleFollow() {
  if (!checkLogin()) return;

  try {
    const data = {
      followed_id: userInfo.value.id
    };

    if (userInfo.value.is_follow == 1) {
      const res = await api.unfollow(data) as any;
      if (res.code == 0 || res.code == 200) {
        userInfo.value.is_follow = 0;
        toast(t('success'));
      } else {
        toast(locale.value == 'jp' ? res.msg_jp : res.msg);
      }
    } else {
      const res = await api.follow(data) as any;
      if (res.code == 0 || res.code == 200) {
        userInfo.value.is_follow = 1;
        toast(t('success'));
      } else {
        toast(locale.value == 'jp' ? res.msg_jp : res.msg);
      }
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}

function goSubscribe() {
  if (!checkLogin()) return;
  router.push(`/subscription-payment?uid=${userInfo.value.id}`);
}

function goUserHome(userId: number) {
  router.replace(`/user-home?id=${userId}`);
}

async function sharePage() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast(t("userHome.shareSuccess"));
  } catch (e) {
    console.error(e);
  }
}

function reportUser() {
  if (!checkLogin()) return;

  showMoreMenu.value = false;
  reportTarget.value = { type: 'user', id: userInfo.value.id };
  reportModalVisible.value = true;
}

function handleReportSubmit(data: { target_type: string; target_id: number | string; reason: string; description: string; images: string[] }) {
  console.log("User report submitted:", data);
}

function onDateChange() {
  loadPosts(true);
}

function doSearch() {
  loadPosts(true);
}

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 1;
    postList.value = null;
    noMore.value = false;
  }

  loading.value = true;
  let authorId = route.query.id;

  // Ensure authorId is a string
  if (Array.isArray(authorId)) {
    authorId = authorId[0];
  }
  if (!authorId) {
    loading.value = false;
    return;
  }

  try {
    // Map currentTab to API type
    const typeMap = {
      all: 0,
      video: 3,
      image: 1,
      article: 2
    };
    const type = typeMap[currentTab.value as keyof typeof typeMap] || 0;

    // Format date range if provided
    let start = '';
    let end = '';
    if (dateRange.value && typeof dateRange.value === 'object') {
      start = dateRange.value.start;
      end = dateRange.value.end;
    }

    const res = await api.authorHome(
      type,
      page.value,
      10,
      authorId,
      searchKeyword.value,
      start,
      end
    );

    const data = res as unknown as { code: number; msg: string; msg_jp: string; data?: any };
    if (data.code === 200 || data.code === 0) {
      const newPosts = (data.data?.data || []).map((item: any) => {
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
          isPinned: item.is_top === '1' || false,
          style: {
            position: "absolute",
            left: "0",
            top: "0",
            width: "25.8rem",
            opacity: 0,
          } as CSSProperties,
        };
      });

      if (!postList.value) {
          postList.value = [];
        }
        postList.value.push(...newPosts);
      sortPosts();

      // Wait for images to load before layout
      nextTick(() => {
        let loadedCount = 0;
        const total = newPosts.length;
        if (total === 0) {
          layoutWaterfall();
          loading.value = false;
          return;
        }

        newPosts.forEach((post: Post) => {
          const img = new Image();
          img.src = post.cover;
          img.onload = img.onerror = () => {
            loadedCount++;
            if (loadedCount === total) {
              layoutWaterfall();
              loading.value = false;
            }
          };
        });
      });

      // Update stats only when type is 0 (all)
      if (type === 0) {
        stats.value = {
          all: parseInt(data.data?.allnums || '0'),
          video: 0, // Need to calculate based on type
          image: 0, // Need to calculate based on type
          article: 0, // Need to calculate based on type
        };

        // Calculate stats based on all posts
        (data.data?.data || []).forEach((item: any) => {
          if (item.type === '1') stats.value.image++;
          else if (item.type === '2') stats.value.article++;
          else if (item.type === '3') stats.value.video++;
        });
      }

      if (newPosts.length < 10) {
        noMore.value = true;
      }
      page.value++;
    } else {
      toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
      loading.value = false;
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'))
    loading.value = false;
  }
}

function goDetail(id: number) {
  router.push({
    path: '/detail',
    query: {
      id: id
    }
  });
}

function setCardMenuRef(el: object | null, id: number) {
  if (el) cardMenuRefs.set(id, el as HTMLElement);
}

function toggleCardMenu(id: number, event?: MouseEvent) {
  if (activeCardMenuId.value === id) {
    activeCardMenuId.value = null;
  } else {
    activeCardMenuId.value = id;
    if (event) {
      const clickY = event.clientY;
      const screenHeight = window.innerHeight;
      // If click is in the bottom 30% of the screen, show menu on top
      if (clickY > screenHeight * 0.7) {
        dropdownPos.value = "top";
      } else {
        dropdownPos.value = "bottom";
      }
    }
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;

  // Top menu
  if (moreMenuRef.value && !moreMenuRef.value.contains(target)) {
    showMoreMenu.value = false;
  }

  // Card menu
  if (activeCardMenuId.value !== null) {
    const el = cardMenuRefs.get(activeCardMenuId.value);
    if (el && !el.contains(target)) {
      activeCardMenuId.value = null;
    }
  }
}

function sortPosts() {
  if (postList.value) {
    postList.value.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }
}

async function pinPost(post: Post) {
  activeCardMenuId.value = null;

  const pinnedCount = postList.value ? postList.value.filter((p) => p.isPinned).length : 0;
  if (pinnedCount >= 3) {
    pendingPinPost.value = post;
    selectedReplaceId.value = null;
    showPinLimitModal.value = true;
    return;
  }

  try {
    await api.postPin({ post_id: post.id });
    post.isPinned = true;
    post.is_top = '1'; // Update is_top to match API response format
    sortPosts();
    // Re-layout waterfall after pinning
    nextTick(() => {
      layoutWaterfall();
    });
    showToast(t("userHome.card.pinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'))
  }
}

async function confirmReplacePin() {
  if (!selectedReplaceId.value || !pendingPinPost.value) return;

  try {
    // Find old and unpin
    const oldPost = postList.value ? postList.value.find((p) => p.id === selectedReplaceId.value) : undefined;
    if (oldPost) {
      oldPost.isPinned = false;
      oldPost.is_top = '0'; // Update is_top to match API response format
    }

    // Pin new
    await api.postPin({ post_id: pendingPinPost.value.id, alter_id: selectedReplaceId.value?.toString() || '' });
    pendingPinPost.value.isPinned = true;
    pendingPinPost.value.is_top = '1'; // Update is_top to match API response format

    showPinLimitModal.value = false;
    pendingPinPost.value = null;
    selectedReplaceId.value = null;

    sortPosts();
    // Re-layout waterfall after pinning
    nextTick(() => {
      layoutWaterfall();
    });
    showToast(t("userHome.card.pinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'))
  }
}

async function unpinPost(post: Post) {
  try {
    await api.postUnpin({ post_id: post.id });
    post.isPinned = false;
    post.is_top = '0';
    activeCardMenuId.value = null;

    nextTick(() => {
      layoutWaterfall();
    });
    showToast(t("userHome.card.unpinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'))
  }
}

function editPost(post: Post) {
  activeCardMenuId.value = null;

  // Navigate to edit page based on post type
  if (post.type === 'video') {
    router.push({ path: '/publish/video', query: { post_id: post.id.toString() } });
  } else if (post.type === 'article') {
    router.push({ path: '/publish/article', query: { post_id: post.id.toString() } });
  } else if (post.type === 'image') {
    router.push({ path: '/publish/image', query: { post_id: post.id.toString() } });
  }
}

async function deletePost(post: Post) {
  try {
    await api.deletePost({ post_id: post.id });
    if (postList.value) {
      postList.value = postList.value.filter((p) => p.id !== post.id);
    }
    activeCardMenuId.value = null;
    showToast(t("userHome.card.deleteSuccess"));
  } catch (error) {
    console.error(error);
    showToast("删除失败");
  }
}
</script>

<style scoped lang="scss">
// :deep(.custom-date-picker) {
//   width: 28rem !important;
//   height: 4.8rem !important;

//   .el-input__wrapper {
//     padding: 0 1.2rem !important;
//     border-radius: 0.8rem !important;
//     background: #f5f5f5 !important;
//     box-shadow: none !important;
//     border: 1px solid transparent;
//     transition: all 0.2s;

//     &.is-focus {
//       border-color: #fb64b6 !important;
//       background: #ffffff !important;
//     }

//     .el-input__inner {
//       color: #364153 !important;
//       &::placeholder {
//         color: #99a1af;
//       }
//     }

//     .el-range-separator {
//       color: #99a1af;
//     }

//     // Custom Icons
//     .el-input__prefix {
//       display: flex;
//       align-items: center;
//       .custom-date-icon {
//         width: 1.6rem;
//         height: 1.6rem;
//       }
//     }

//     .el-input__suffix {
//       display: none; // Hide default clear icon
//     }
//   }

//   // Add custom arrow on the right
//   position: relative;
//   &::after {
//     content: "";
//     position: absolute;
//     right: 1.2rem;
//     top: 50%;
//     transform: translateY(-50%);
//     width: 1.2rem;
//     height: 1.2rem;
//     background: url("@/assets/images/user/down.png") no-repeat center;
//     background-size: contain;
//     pointer-events: none;
//   }
// }

.user-homepage {
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
  padding-bottom: 2rem;
}

.home-bg {
  position: relative;
  width: 100%;
  height: 28rem;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(254, 253, 254, 0) 0%, #fefdfe 100%);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.main-content {
  max-width: 112.8rem;
  margin: -12rem auto 0;
}

.user-info-card {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  margin-bottom: 2.4rem;
  border-radius: 1.2rem;
  padding: 2.4rem;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.8) 0%, #ffffff 100%);
  box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);

  .info-left {
    display: flex;
    align-items: center;
    width: 10rem;
    height: 10rem;
    line-height: 0;

    .avatar {
      width: 10rem;
      height: 10rem;
      border-radius: 0.8rem;
      border: 3px solid rgba(251, 100, 182, 0.5);
      object-fit: cover;
    }
  }

  .info-right {
    flex: 1;

    .text-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;

      .text-info {
        .name-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.4rem;
          .nickname {
            font-size: 2rem;
            font-weight: bold;
            color: #101828;
          }
        }
        .id-row {
          font-size: 1.4rem;
          color: #6a7282;
        }
      }

      .actions {
        display: flex;
        gap: 1.2rem;
        align-items: center;

        .btn {
          min-width: 13.6rem;
          height: 4.8rem;
          padding: 0 1rem;
          border-radius: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;

          &.edit {
            background: #fb64b6;
            color: #ffffff;
            border: none;

            &:hover{
              position: relative;

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.2);
              }
            }
          }

          &.follow {
            background: #fb64b6;
            color: #ffffff;
            border: none;

            &:hover {
              position: relative;

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.2);
              }
            }

            &.followed {
              position: relative;
              border: 1px solid rgba(251, 100, 182, 0.2);
              background: #ffffff;
              color: rgba(251, 100, 182, 0.5);

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(251, 100, 182, 0.06);
              }

              &:hover {
                border: 1px solid #fb64b6;
              }
            }
          }

          &.subscribe {
            background: #00d3f2;
            color: #ffffff;
            border: none;
            padding: 0 2rem;

            &:hover {
              position: relative;
              transition: all 0.2s;

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.2);
              }
            }

            &.subscribed {
              position: relative;
              border: 1px solid rgba(0, 211, 242, 0.2);
              background: #ffffff;
              color: rgba(0, 211, 242, 0.5);

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 211, 242, 0.06);
              }

              &:hover {
                border: 1px solid #00d3f2;
              }
            }
          }
          &.share {
            background: #ffffff;
            border: 1px solid #c27aff;
            color: #c27aff;
            padding: 0 1.6rem;

            &:hover {
              position: relative;
              transition: all 0.2s;

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(194, 122, 255, 0.06);
              }
            }
            img {
              width: 2.4rem;
              height: 2.4rem;
            }
          }
          &.more {
            background: transparent;
            border: none;
            padding: 0;
            width: 3.2rem;
            img {
              width: 2.4rem;
              height: 2.4rem;
            }
          }
        }

        .more-menu-wrap {
          position: relative;
          img {
            width: 2.4rem;
            height: 2.4rem;
            cursor: pointer;
          }
          .dropdown-menu {
            position: absolute;
            right: -1.8rem;
            top: 100%;
            margin-top: 0.2rem;
            background: #ffffff;
            border: 1px solid rgba(251, 100, 182, 0.2);
            border-radius: 0.6rem;
            box-shadow: 0px 0px 15px -3px rgba(0, 0, 0, 0.08);
            z-index: 100;
            cursor: pointer;

            .menu-item {
              display: flex;
              align-items: center;
              justify-content: center;
              min-width: 5.8rem;
              height: 2.8rem;
              padding: 0.5rem 1rem;
              font-size: 1.2rem;
              color: #6a7282;
            }
          }
        }
      }
    }

    .desc-box {
      position: relative;
      .desc-text {
        font-size: 1.4rem;
        color: #6a7282;
        line-height: 2rem;
        &.collapsed {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
      .expand-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 1rem;
        cursor: pointer;
        color: #00d3f2;
        font-size: 1.4rem;

        &.hide {
          color: #99a1af;
        }
        img {
          width: 2rem;
          height: 2rem;
        }
      }
    }
  }
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.8rem;

  .posts-title {
    font-size: 1.6rem;
    font-weight: bold;
    color: #101828;
    cursor: pointer;
    &.active {
      color: #fb64b6;
    }
  }

  .stats-nums {
    display: flex;
    gap: 2.4rem;
    font-size: 1.4rem;
    .stat-item {
      color: #6a7282;
      cursor: pointer;
      &.active {
        color: #fb64b6;

        .val {
          color: #fb64b6;
        }
      }
      .val {
        color: #101828;
        font-weight: 600;
        margin-left: 0.4rem;
      }
    }
  }
}

.container {
  border-radius: 1.2rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  background: rgba(255, 255, 255, 0.8);
}

.filter-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 7.2rem;
  margin-bottom: 2.4rem;
  padding: 0 1.2rem 0 2.4rem;
  border-bottom: 1px solid #f2f4f7;

  &.cur{
    justify-content: flex-start;
  }

  .tabs {
    display: flex;
    gap: 3rem;
    height: 100%;
    .tab-item {
      display: flex;
      align-items: center;
      font-size: 1.6rem;
      color: #6a7282;
      cursor: pointer;
      position: relative;

      &.active {
        color: #101828;
        font-weight: 600;
        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0.2rem;
          background: #fb64b6;
        }
      }
    }
  }

  .filters {
    display: flex;
    gap: 1.6rem;
    align-items: center;

    .search-box {
      position: relative;
      input {
        width: 28rem;
        height: 4.8rem;
        background: #f5f5f5;
        border: 1px solid transparent;
        border-radius: 0.8rem;
        padding: 0 5rem 0 1.2rem;
        font-size: 1.4rem;
        outline: none;

        &::placeholder {
          color: #99a1af;
        }

        &:focus {
          border-color: #fb64b6;
          background: #ffffff;
        }
      }
      .search-icon {
        position: absolute;
        right: 0.6rem;
        top: 50%;
        transform: translateY(-50%);
        width: 3.6rem;
        height: 3.6rem;
        cursor: pointer;
      }
    }
  }
}

.posts-container {
  min-height: 40rem;
  padding: 0 2.4rem;

  .waterfall {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .post-card {
    // transition: all 0.3s ease;
    // overflow: hidden;

    .card-cover {
      position: relative;
      width: 25.8rem;
      height: 34.4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      img.cover-img {
        width: auto;
        max-width: 100%;
        display: block;
        height: 34.4rem;
        border-radius: 1.2rem;
        object-fit: cover;
      }

      .video-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -42%);
        img {
          width: 8rem;
          height: 8rem;
        }
      }

      .pinned-tag {
        position: absolute;
        top: 0.8rem;
        left: 0.8rem;
        background: rgba(255, 255, 255, 0.5);
        color: #fb64b6;
        padding: 0.7rem 1rem;
        border: 1px solid rgba(251, 100, 182, 0.5);
        border-radius: 0.6rem;
        font-size: 1.2rem;
      }
    }

    .card-info {
      padding: 1.2rem 0 0;

      .card-desc {
        font-size: 1.4rem;
        color: #101828;
        margin-bottom: 1.2rem;
        line-height: 2rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .time {
          font-size: 1.2rem;
          color: #99a1af;
        }

        .more-btn-wrap {
          position: relative;
          img {
            width: 1.8rem;
            height: 1.8rem;
            cursor: pointer;
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            background: #ffffff;
            border: 1px solid rgba(251, 100, 182, 0.2);
            border-radius: 0.8rem;
            padding: 0.6rem 0;
            z-index: 10;
            min-width: 10rem;
            box-shadow: 0px 0px 12px -4px rgba(0, 0, 0, 0.18);

            &.bottom {
              top: 100%;
              margin-top: 0.4rem;
            }
            &.top {
              bottom: 100%;
              margin-bottom: 0.4rem;
            }

            .menu-item {
              padding: 0.6rem 0;
              font-size: 1.4rem;
              color: #6a7282;
              cursor: pointer;
              text-align: center;
              &:hover {
                font-weight: bold;
                color: #101828;
              }
            }
          }
        }
      }
    }

    &:hover .card-footer .more-btn-wrap img {
      opacity: 1;
    }
  }

  .no-data {
    text-align: center;
    color: #99a1af;
    font-size: 1.4rem;
    padding: 4rem 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40rem;
  }

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid rgba(251, 100, 182, 0.2);
    border-top: 0.4rem solid #fb64b6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.6rem;
  }

  .loading-text {
    font-size: 1.6rem;
    color: #666;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

.follow-container {
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 0 2.4rem 2.4rem;
  min-height: 40rem;

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40rem;
  }

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid rgba(251, 100, 182, 0.2);
    border-top: 0.4rem solid #fb64b6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.6rem;
  }

  .loading-text {
    font-size: 1.6rem;
    color: #666;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .privacy-hidden {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8rem 0;
    .hide-icon {
      width: 4.8rem;
      height: 4.8rem;
      margin-bottom: 1.2rem;
    }
    p {
      font-weight: bold;
      font-size: 1.6rem;
      color: #364153;
    }
  }

  .follow-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2.4rem;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .follow-card {
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
      color: #6a7282;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    padding-top: 2.4rem;

    :deep(.el-pagination) {
      .el-pager li {
        background: transparent;
        &.is-active {
          color: #fb64b6;
          font-weight: bold;
        }
        &:hover {
          color: #fb64b6;
        }
      }
      button {
        background: transparent;
        &:hover {
          color: #fb64b6;
        }
      }
    }
  }
}

.pin-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;

  .pin-modal {
    position: relative;
    width: 70rem;
    background: #ffffff;
    border-radius: 1.2rem;
    padding: 1.8rem 0;
    display: flex;
    flex-direction: column;

    .close-icon {
      position: absolute;
      top: 1.8rem;
      right: 1.8rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2.4rem 1.8rem;
      margin-bottom: 1.8rem;
      border-bottom: 1px solid rgba(251, 100, 182, 0.2);

      .title {
        font-size: 1.6rem;
        font-weight: 600;
        color: #364153;
      }
    }

    .modal-desc {
      padding: 0 2.4rem;
      font-size: 1.4rem;
      color: #364153;
      margin-bottom: 1.8rem;
    }

    .pinned-list {
      display: flex;
      gap: 1.2rem;
      margin-bottom: 1.8rem;
      padding: 0 2.4rem 2.4rem;
      border-bottom: 1px solid rgba(251, 100, 182, 0.2);

      .pinned-item {
        flex: 1;
        cursor: pointer;

        .item-cover {
          width: 100%;
          margin-bottom: 1.2rem;
          aspect-ratio: 3/4;
          object-fit: cover;
          border: 2px solid transparent;
          border-radius: 0.8rem;
          transition: all 0.2s;
        }

        .item-title {
          font-size: 1.4rem;
          color: #101828;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.selected {
          .item-cover {
            border-color: #fb64b6;
          }

          .item-title {
            color: #fb64b6;
          }
        }
      }
    }

    .confirm-btn {
      align-self: center;
      width: 24rem;
      height: 4.8rem;
      background: #fb64b6;
      color: #ffffff;
      border: none;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      cursor: pointer;

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      &:hover {
        position: relative;

        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
}
</style>