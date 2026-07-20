<template>
  <div class="user-homepage">
    <Header :cur="4" ref="headerRef"></Header>

    <!-- Top Banner -->
    <div class="home-bg">
      <img :src="userInfo.headerImage || defaultHeaderImg" alt="" />
    </div>

    <div class="main-content">
      <!-- User Info Card -->
      <div class="user-info-card">
        <div class="info-left">
          <img class="avatar" :src="userInfo.avatar || defaultAvatar" alt="avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        </div>

        <div class="info-right">
          <div class="text-inner">
            <div class="text-info">
              <div class="name-row">
                <span class="nickname">{{ userInfo.nickname }}</span>
              </div>
              <div class="kyc-row" v-if="userInfo.kyc_status == 1">
                <span>{{ t("userHome.verified") }}</span>
              </div>
              <!-- <div class="id-row">{{ t("userHome.info.id") }}: {{ userInfo.id }}</div> -->
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
                  <span class="btn-text">{{ userInfo.is_follow == 1 ? t("detail.following") : t("detail.follow") }}</span>
                  <span class="hover-text" v-if="userInfo.is_follow == 1">{{ t("detail.unfollow") }}</span>
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
                <span class="share-icon"></span>
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
                  <div
                    class="menu-item block-item"
                    :class="{ blocked: userInfo.is_blacked == 1 }"
                    @click="handleBlockClick"
                    @mouseenter="handleBlockHover(true)"
                    @mouseleave="handleBlockHover(false)"
                  >
                    {{ userInfo.is_blacked == 1 ? t("userHome.unblock") : t("userHome.block") }}
                  </div>
                  <div
                    class="block-tip"
                    v-if="userInfo.is_blacked != 1 && showBlockTip"
                  >{{ t("userHome.blockTip") }}</div>
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
        <div class="posts-title">
          <div
            v-for="type in contentTypes"
            :key="type.id"
            class="type-item"
            :class="{ active: viewMode === 'posts' && activeContentType == type.id }"
            @click="setActiveContentType(type.id)"
          >
            {{ type.label }} ({{ type.count }})
          </div>
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
        <template v-if="viewMode == 'posts'">
          <!-- Filters & Tabs -->
          <div class="filter-bar">
            <div class="collection-header">
              <button
                class="create-collection-btn"
                v-if="isSelf"
                @click="createCollection"
              >
                <img class="plus-icon" src="@/assets/images/user/upload.png" alt="" />
                <span>{{ t("userHome.collection.create") }}</span>
              </button>
            </div>

            <!-- <div class="filters">
              <div class="sort-box">
                <img class="sort-btn" :src="sortBy == 'newest' ? ascIcon : descIcon" alt="" @click="toggleSort" />
              </div>
            </div> -->
          </div>

          <!-- Collection Grid List -->
          <div class="collections-container">
            <div
              class="blocked-message"
              v-if="userInfo.is_blacked == 1"
            >
              <img class="blocked-icon" src="@/assets/images/user/block.png" alt="" />
              <p>{{ t("userHome.blockedMessage") }}</p>
            </div>

            <!-- Loading state takes priority -->
            <div v-if="loading" class="loading-state">
              <div class="loading-spinner"></div>
              <div class="loading-text">{{ t("userHome.loading") }}</div>
            </div>

            <!-- Collection grid -->
            <div
              class="collections-grid"
              v-else-if="collections && collections.length > 0 && userInfo.is_blacked != 1"
            >
              <div
                class="collection-card"
                v-for="(collection, index) in collections"
                :key="collection.id"
                ref="collectionCardRefs"
                :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }"
              >
                <div class="card-cover" @click="goCollectionDetail(collection.id)">
                   <img :src="processImageUrl(collection.cover) || defaultCover" alt="" class="cover-img" />
                   <div class="r18-overlay" v-if="collection.is_nsfw == 1">
                     <span class="r18-text">R18</span>
                   </div>
                   <div class="pinned-tag" v-if="collection.is_top === '1'">
                     {{ t("userHome.collection.pinned") }}
                   </div>

                  <div class="card-bottom">
                    <div class="update-badge" v-if="collection.chapter_count > 0">
                      {{ activeContentType === 2 ? t("userHome.collection.updatedChapter", { count: collection.chapter_count }) : t("userHome.collection.updatedEpisode", { count: collection.chapter_count }) }}
                    </div>
                    <div class="card-actions" v-if="isSelf">
                      <div
                        class="card-action-btn"
                        @click.stop="collection.is_top === '1' ? unpinCollection(collection) : pinCollection(collection)"
                      >
                        <img src="@/assets/images/user/top.png" alt="" />
                      </div>
                      <div
                        class="card-action-btn"
                        @click.stop="goCollectionSettings(collection.id)"
                      >
                        <img src="@/assets/images/user/set.png" alt="" />
                      </div>
                      <div
                        class="card-action-btn"
                        @click.stop="goChapterManage(collection.id)"
                      >
                        <img src="@/assets/images/user/chapter.png" alt="" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card-info">
                  <div class="card-desc">{{ collection.title }}</div>
                </div>
              </div>
            </div>

            <EmptyState v-else-if="collectionsInitialized && collections.length == 0 && userInfo.is_blacked != 1" />

            <!-- Load more indicator -->
            <div class="load-more" ref="loadMoreRef" v-if="collectionsInitialized && collections.length > 0 && hasMoreCollections">
              <div v-if="collectionsLoading" class="loading-spinner small"></div>
              <span v-else>{{ t("userHome.loadMore") }}</span>
            </div>
          </div>
        </template>

        <!-- Follow/Fans List View -->
        <template v-else>
          <!-- <div class="filter-bar">
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
          </div> -->

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
                  <div class="follow-card" v-for="(user, index) in followList" :key="user.id" :style="{ animationDelay: `${Math.min(index * 35, 300)}ms` }" @click="goUserHome(user.id)">
                    <div class="card-top">
                      <img :src="user.avatar || defaultAvatar" class="user-avatar" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
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
                        @click.stop="toggleListFollow(user)"
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
            v-for="item in pinnedCollections"
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

    <!-- Block Confirm Modal -->
    <div class="block-confirm-modal" v-if="showBlockConfirmModal">
      <div class="modal-overlay" @click="showBlockConfirmModal = false"></div>
      <div class="modal-content">
        <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="showBlockConfirmModal = false" />
        <div class="modal-title">{{ t("userHome.blockConfirm") }}</div>
        <div class="modal-message">
          {{ t("userHome.blockTip") }}
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="showBlockConfirmModal = false">{{ t('home.styleSelect.cancel') }}</button>
          <button class="btn btn-confirm" @click="confirmBlockUser">{{ t('home.styleSelect.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-if="showEditCollectionModal"
      :visible="showEditCollectionModal"
      :is-edit="!!editingCollectionId"
      :collection-id="editingCollectionId"
      :collection-name="editingCollectionName"
      :cover-url="editingCollectionCover"
      :description="editingCollectionDescription"
      @close="showEditCollectionModal = false"
      @save="handleEditCollectionSave"
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
import EditCollectionModal from "@/components/EditCollectionModal.vue";
import defaultHeaderImg from "@/assets/images/user/pic.jpg";
import successIcon from "@/assets/images/user/success.png";
import defaultAvatar from "@/assets/images/base/avatar.png";
import defaultCover from "@/assets/images/base/cover.png";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick
} from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import { processImageUrl, initLanguage, formatTimestamp } from "@/util/utils";
import { useRoute } from "vue-router";
import api from "@/api/index";
import { eventBus } from "@/utils/eventBus";

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

const headerRef = ref<InstanceType<typeof Header> | null>(null);
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
  is_blacked: number;
  subscribe_price: string;
  description: string;
  following: number;
  fans: number;
  likes: number;
  posts: number;
  subPrice: string;
  subscription_plans: SubscriptionPlan[] | SubscriptionPlan | null;
  novelCount?: number;
  comicCount?: number;
  total_posts?: number;
  total_posts_1?: number;
  total_posts_2?: number;
  total_posts_3?: number;
  kyc_status?: number | string;
}

interface BooksGroupItem {
  type: string;
  num: string;
}

interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  headerImage: string;
  is_follow: number;
  is_subscribe: number;
  is_blacked: number;
  subscribe_price: string;
  description: string;
  following: number;
  fans: number;
  likes: number;
  posts: number;
  subPrice: string;
  subscription_plans: SubscriptionPlan[] | SubscriptionPlan | null;
  novelCount?: number;
  comicCount?: number;
  total_posts?: number;
  total_posts_1?: number;
  total_posts_2?: number;
  total_posts_3?: number;
  kyc_status?: number | string;
  books_group?: BooksGroupItem[];
}

// User Info
const userInfo = ref<UserInfo>({
  id: "",
  nickname: "",
  avatar: "",
  headerImage: "",
  is_follow: 0,
  is_subscribe: 0,
  is_blacked: 0,
  subscribe_price: "",
  description: "",
  following: 0,
  fans: 0,
  likes: 0,
  posts: 0,
  subPrice: "",
  subscription_plans: null,
  novelCount: 0,
  comicCount: 0,
  total_posts: 0,
  total_posts_1: 0,
  total_posts_2: 0,
  total_posts_3: 0,
  books_group: []
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
const showBlockTip = ref(false);
const showBlockConfirmModal = ref(false);

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

  return (plans as SubscriptionPlan).price || '0';
}

const moreMenuRef = ref<HTMLElement | null>(null);
const collectionMenuRef = ref<HTMLElement | null>(null);


const isSelf = computed(() => {
  const localUid = localStorage.getItem("uid");
  return localUid === userInfo.value.id;
});

const currentTab = ref("all");
const dateRange = ref({ start: '', end: '' });
const searchKeyword = ref("");

// Content types - read count from books_group
const contentTypes = computed(() => {
  const booksGroup = userInfo.value.books_group || [];

  const getCountByType = (type: string) => {
    const item = booksGroup.find((item: BooksGroupItem) => item.type === type);
    return item ? parseInt(item.num) || 0 : 0;
  };

  return [
    { id: 2, label: t('userHome.contentType.novel'), count: getCountByType('2') || userInfo.value.total_posts_2 || 0 },
    { id: 1, label: t('userHome.contentType.comic'), count: getCountByType('1') || userInfo.value.total_posts_1 || 0 },
    { id: 3, label: t('userHome.contentType.video'), count: getCountByType('3') || userInfo.value.total_posts_3 || 0 }
  ];
});

const activeContentType = ref(2);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);

// User region (true = not in China, false = in China)
const userRegion = ref(false);
const hasFetchedRegion = ref(false);

// Collection tabs
interface CollectionTab {
  id: number;
  label?: string;
  title?: string;
  count?: number;
}

const collectionTabs = ref<CollectionTab[]>([
  { id: 0, label: t('userHome.collection.all') }
]);



const activeCollectionTab = ref(0);
const showCollectionMenu = ref(false);

const postList = ref<Post[] | null>(null);
const noMore = ref(false);
const page = ref(1);
const limit = ref(10);

const currentCollectionPage = ref(1);
const collectionPageSize = 6;

// Edit collection modal
const showEditCollectionModal = ref(false);
const editingCollectionId = ref('');
const editingCollectionName = ref('');
const editingCollectionCover = ref('');
const editingCollectionDescription = ref('');

// Collections data
const collections = ref<any[]>([]);
const collectionsInitialized = ref(false);
const hasMoreCollections = ref(true);
const currentCollectionsPage = ref(1);
const collectionsLoading = ref(false);

// Pin related variables
const showPinLimitModal = ref(false);
const selectedReplaceId = ref<number | null>(null);
const pendingPinCollection = ref<any>(null);

const pinnedCollections = computed(() => {
  return collections.value.filter((col) => col.is_top === '1');
});

const currentCollection = computed(() => {
  if (activeCollectionTab.value === 0) return null;
  return collections.value.find(col => col.id === activeCollectionTab.value) || null;
});

const totalCollectionPages = computed(() => {
  return Math.ceil(collectionTabs.value.length / collectionPageSize);
});

const currentPageCollectionTabs = computed(() => {
  const start = (currentCollectionPage.value - 1) * collectionPageSize;
  const end = start + collectionPageSize;
  return collectionTabs.value.slice(start, end);
});

// Fetch collections - show all types
async function fetchCollections(reset = false) {
  if (collectionsLoading.value && !reset) return;

  try {
    if (reset) {
      collections.value = [];
      currentCollectionsPage.value = 1;
      hasMoreCollections.value = true;
      loading.value = true;
      collectionsInitialized.value = false;
    }
    collectionsLoading.value = true;

    let authorId = route.query.id;
    // Ensure authorId is a string
    if (Array.isArray(authorId)) {
      authorId = authorId[0];
    }

    const localUid = localStorage.getItem('uid');
    const isCurrentUser = localUid == authorId;

    let response;
    // type: 1=comic, 2=novel, 3=video
    const type = activeContentType.value;
    const currentPage = currentCollectionsPage.value;

    if (isCurrentUser) {
      // Fetch own collections
      response = await api.authorSelfCollection(type, currentPage, 20) as any;
    } else {
      // Fetch other author's collections
      if (!authorId) {
        collectionsLoading.value = false;
        return;
      }
      response = await api.authorCollection(type, currentPage, 20, authorId) as any;
    }
    if (response.code == 0) {
      const collectionData = response.data?.data || [];

      if (reset) {
        collections.value = collectionData;
      } else {
        collections.value.push(...collectionData);
      }

      // Update collection tabs - only on first load or reset
      if (reset || currentPage === 1) {
        collectionTabs.value = [
          { id: 0, label: t('userHome.collection.all') }
        ];

        // Add collection tabs after "all"
        collections.value.forEach((collection: any) => {
          collectionTabs.value.push({
            id: collection.id,
            title: collection.title,
            count: collection.chapters?.length || 0
          });
        });

        // Reset pagination when collections change
        currentCollectionPage.value = 1;
      }

      // Check if there are more pages
      if (collectionData.length < 20) {
        hasMoreCollections.value = false;
      } else {
        currentCollectionsPage.value++;
      }
    }
    collectionsInitialized.value = true;
    collectionsLoading.value = false;
    loading.value = false;
  } catch (error) {
    console.error('Error fetching collections:', error);
    collectionsInitialized.value = true;
    collectionsLoading.value = false;
    loading.value = false;
  }
}

const loading = ref(false);

const collectionCardRefs = ref<HTMLElement[]>([]);

const activeCollectionMenuId = ref<string | number | null>(null);
const collectionMenuRefs = new Map<string | number, HTMLElement>();
const dropdownPos = ref("bottom");

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

  const localUid = localStorage.getItem('uid');
  const isSelf = localUid == authorId;

  loadingUserInfo.value = true;
  try {
    let res;
    if (isSelf) {
      res = await api.authorSelfInfo();
    } else {
      if (!authorId) return;
      const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1';
      const showNsfw = userRegion.value && allowSensitive ? 1 : 0;
      res = await api.authorInfo(authorId, showNsfw);
    }

    const data = res as any;
    if (data.code === 200 || data.code === 0) {
      const subPrice = data.data?.sub_price || '';
      userInfo.value = {
        id: data.data?.user?.id || data.data?.id || '',
        nickname: data.data?.user?.nickname || data.data?.nickname || '',
        avatar: data.data?.user?.avatar || data.data?.avatar || '',
        headerImage: data.data?.user_page?.page_banner || data.data?.page_banner || '',
        is_follow: data.data?.is_follow || 0,
        is_subscribe: data.data?.is_subscribe || 0,
        is_blacked: data.data?.is_blacked || 0,
        subscribe_price: data.data?.subscribe_price || '',
        subscription_plans: data.data?.subscription_plans || null,
        description: data.data?.user_page?.page_desc || data.data?.page_desc || '',
        following: parseInt(data.data?.user?.following_count || data.data?.following_count || '0'),
        fans: parseInt(data.data?.user?.follower_count || data.data?.follower_count || '0'),
        likes: parseInt(data.data?.total_like_count || '0'),
        posts: parseInt(data.data?.total_posts || '0'),
        subPrice: subPrice,
        novelCount: parseInt(data.data?.novelCount || data.data?.novel_count || '0'),
        comicCount: parseInt(data.data?.comicCount || data.data?.comic_count || '0'),
        total_posts: parseInt(data.data?.total_posts || '0'),
        total_posts_1: parseInt(data.data?.total_posts_1 || '0'),
        total_posts_2: parseInt(data.data?.total_posts_2 || '0'),
        total_posts_3: parseInt(data.data?.total_posts_3 || '0'),
        kyc_status: data.data?.kyc_status || 0,
        books_group: data.data?.books_group || [],
      };

    } else {
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  } finally {
    loadingUserInfo.value = false;
  }
}

function onUserLoggedOut() {
  userInfo.value.is_follow = 0;
  userInfo.value.is_subscribe = 0;
  if (!isSelf.value) {
    fetchUserInfo();
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

function setSeoMeta() {
  document.title = t('seo.userHome.title');
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.userHome.keywords'));
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.userHome.description'));
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

onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  eventBus.on('userLoggedOut', onUserLoggedOut);

  window.scrollTo(0, 0);

  await initLanguage();
  getCountry();
  setSeoMeta();

  // Restore last content type if coming back from detail page
  try {
    const lastContentType = localStorage.getItem('userHomeContentType');
    if (lastContentType !== null) {
      const contentTypeNum = parseInt(lastContentType, 10);
      if (!isNaN(contentTypeNum)) {
        activeContentType.value = contentTypeNum;
      }
      localStorage.removeItem('userHomeContentType');
    }
  } catch (error) {
    console.error('Error loading last content type:', error);
  }

  // First fetch user info
  await fetchUserInfo();

    const typeParam = route.query.type;
    if (typeParam) {
      const typeNum = parseInt(typeParam as string);
      if (!isNaN(typeNum) && [1, 2, 3].includes(typeNum)) {
        activeContentType.value = typeNum;
      }
    }

    const tabParam = route.query.tab;
    if (tabParam) {
      const tab = parseInt(tabParam as string);
      switch (tab) {
        case 1:
          goToCollections(true);
          break;
        case 2:
          showFollowList('following', true);
          break;
        case 3:
          showFollowList('fans', true);
          break;
      }
    } else {
      goToCollections(true);
    }

  });

// Set up infinite scroll for collections
const loadMoreRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMoreCollections.value && !collectionsLoading.value && collectionsInitialized.value) {
        fetchCollections();
      }
    },
    {
      rootMargin: '100px',
      threshold: 0.1
    }
  );
});

watch(loadMoreRef, (el) => {
  if (observer && el) {
    observer.observe(el);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  eventBus.off('userLoggedOut', onUserLoggedOut);
  if (observer) {
    observer.disconnect();
  }
});

watch(viewMode, (newVal) => {
  if (newVal === "posts") {
    // No need for layoutWaterfall with flexbox
  }
});

watch(currentTab, () => {
  if (viewMode.value === 'posts') {
    // Collections only, no posts
  }
});

let lastId = ref(route.query.id);
let lastTab = ref(route.query.tab);
let lastType = ref(route.query.type);

watch(() => [route.query.id, route.query.tab, route.query.type], async ([newId, newTab, newType], [oldId, oldTab, oldType]) => {

  const idChanged = newId !== oldId;
  const tabChanged = newTab !== oldTab;
  const typeChanged = newType !== oldType;

  if (idChanged) {
    // Reset states
    userInfo.value = {
      id: "",
      nickname: "",
      avatar: "",
      headerImage: "",
      is_blacked: 0,
      is_follow: 0,
      is_subscribe: 0,
      subscribe_price: "",
      description: "",
      following: 0,
      fans: 0,
      likes: 0,
      posts: 0,
      subPrice: "",
      subscription_plans: null,
    };
    postList.value = null;
    followList.value = [];
    loading.value = false;
    noMore.value = false;
    page.value = 1;
    followPage.value = 1;
    isPrivacyHidden.value = false;

    // Fetch new user info and data
    await fetchUserInfo();

    const typeParam = newType;
    if (typeParam) {
      const typeNum = parseInt(typeParam as string);
      if (!isNaN(typeNum) && [1, 2, 3].includes(typeNum)) {
        activeContentType.value = typeNum;
      }
    }

    const tabParam = newTab;
    if (tabParam) {
      const tabVal = parseInt(tabParam as string);
      switch (tabVal) {
        case 1:
          goToCollections(true);
          break;
        case 2:
          showFollowList('following', true);
          break;
        case 3:
          showFollowList('fans', true);
          break;
      }
    } else {
      goToCollections(true);
    }
  }

  else if (typeChanged && newType) {
    const typeNum = parseInt(newType as string);
    if (!isNaN(typeNum) && [1, 2, 3].includes(typeNum)) {
      setActiveContentType(typeNum);
    }
  }

  else if (tabChanged && newTab) {
    const tabVal = parseInt(newTab as string);
    switch (tabVal) {
      case 1:
        goToCollections(true);
        break;
      case 2:
        showFollowList('following', true);
        break;
      case 3:
        showFollowList('fans', true);
        break;
    }
  }

  lastId.value = newId;
  lastTab.value = newTab;
  lastType.value = newType;
});

// Watch for language changes
watch(() => locale.value, () => {
  // Re-fetch collections to update translations
  fetchCollections();
  // Update SEO meta tags when language changes
  setSeoMeta();
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

// Set active content type
function setActiveContentType(typeId: number) {
  viewMode.value = "posts";
  activeContentType.value = typeId;
  activeCollectionTab.value = 0;
  fetchCollections(true);

  const newQuery = { ...route.query };
  delete newQuery.tab;
  delete newQuery.type;

  if (JSON.stringify(newQuery) !== JSON.stringify(route.query)) {
    router.replace({
      path: "/user-home",
      query: newQuery,
    });
  }
}

// Set active collection tab
function setActiveCollectionTab(tabId: number) {
  activeCollectionTab.value = tabId;
}

function prevCollectionPage() {
  if (currentCollectionPage.value > 1) {
    currentCollectionPage.value--;
  }
}

function nextCollectionPage() {
  if (currentCollectionPage.value < totalCollectionPages.value) {
    currentCollectionPage.value++;
  }
}



// Delete collection
async function deleteCollection() {
  showCollectionMenu.value = false;

  if (!currentCollection.value) return;

  try {
    // Get book_id from current collection
    const book_id = currentCollection.value.id;

    // Call delete collection API
    const res = await api.deleteCollection({ book_id }) as any;

    if (res.code == 0) {
      toast(t('succcess'));
      // Refresh collections
      await fetchCollections();
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }

    // Reset to all tab
    activeCollectionTab.value = 0;
  } catch (error) {
    console.error('Error deleting collection:', error);
    toast(t('fail'));
  }
}

function showFollowList(tab: "following" | "fans", fromRouteOrEvent: boolean | MouseEvent = false) {
  const fromRoute = typeof fromRouteOrEvent === 'boolean' ? fromRouteOrEvent : false;

  viewMode.value = "follow";
  followTab.value = tab;

  followList.value = [];
  followPage.value = 1;
  isPrivacyHidden.value = false;
  fetchFollowList(true);

  if (!fromRoute) {
    const newQuery = { ...route.query };
    delete newQuery.tab;

    if (JSON.stringify(newQuery) !== JSON.stringify(route.query)) {
      router.replace({
        path: "/user-home",
        query: newQuery,
      });
    }
  }
}

function goToCollections(fromRouteOrEvent: boolean | MouseEvent = false) {
  const fromRoute = typeof fromRouteOrEvent === 'boolean' ? fromRouteOrEvent : false;

  viewMode.value = "posts";
  currentTab.value = "all";

  fetchCollections();

  if (!fromRoute) {
    const newQuery = { ...route.query };
    delete newQuery.tab;

    if (JSON.stringify(newQuery) !== JSON.stringify(route.query)) {
      router.replace({
        path: "/user-home",
        query: newQuery,
      });
    }
  }
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

    const data = res as any;
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
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
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
      const response = res as any;
      if (response.code === 200 || response.code === 0) {
        await fetchFollowList(true);
        userInfo.value.following = Math.max(0, userInfo.value.following - 1);
        if (headerRef.value) {
          headerRef.value.getUserInfo();
        }
        toast(t('success'));
      } else {
        toast(locale.value == 'en' ? response.msg : locale.value == 'zh' ? response.msg_cn : locale.value == 'tc' ? response.msg_tc : response.msg_jp);
      }
    } else {
      const res = await api.follow(data);
      const response = res as any;
      if (response.code === 200 || response.code === 0) {
        user.isFollowed = true;
        userInfo.value.following = userInfo.value.following + 1;
        if (headerRef.value) {
          headerRef.value.getUserInfo();
        }
        toast(t('success'));
      } else {
        toast(locale.value == 'en' ? response.msg : locale.value == 'zh' ? response.msg_cn : locale.value == 'tc' ? response.msg_tc : response.msg_jp);
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

        if (headerRef.value) {
          headerRef.value.getUserInfo();
        }
        toast(t('success'));
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    } else {
      const res = await api.follow(data) as any;
      if (res.code == 0 || res.code == 200) {
        userInfo.value.is_follow = 1;

        if (headerRef.value) {
          headerRef.value.getUserInfo();
        }
        toast(t('success'));
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
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

function handleBlockHover(show: boolean) {
  if (userInfo.value.is_blacked != 1) {
    showBlockTip.value = show;
  }
}

function handleBlockClick() {
  if (!checkLogin()) return;

  if (userInfo.value.is_blacked == 1) {
    confirmBlockUser();
  } else {
    showBlockConfirmModal.value = true;
  }
}

async function confirmBlockUser() {
  if (!checkLogin()) return;

  showBlockConfirmModal.value = false;
  showMoreMenu.value = false;

  const isBlacked = userInfo.value.is_blacked == 1;

  try {
    let response;
    if (isBlacked) {
      response = await api.unblockUser({
        user_id: userInfo.value.id
      }) as any;
    } else {
      response = await api.blockUser({
        user_id: userInfo.value.id,
        reason: 'black'
      }) as any;
    }

    if (response.code == 0) {
      userInfo.value.is_blacked = isBlacked ? 0 : 1;

      if (isBlacked) {
        toast(t("userHome.unblockSuccess"));
        await fetchCollections();
        // loadPosts(true);
      } else {
        collections.value = [];
        collectionTabs.value = [{ id: 0, label: t('userHome.collection.all') }];
        activeCollectionTab.value = 0;
      }
    } else {
      toast(locale.value == 'en' ? response.msg : locale.value == 'zh' ? response.msg_cn : locale.value == 'tc' ? response.msg_tc : response.msg_jp);
    }
  } catch (error) {
    console.error('Failed to block/unblock user:', error);
    toast(t('fail'));
  }
}

async function handleReportSubmit(data: { target_type: string; target_id: number | string; reason: string; description: string; images: string[] }) {

}

function onDateChange() {
  // Collections only, no posts
}

function doSearch() {
  // Collections only, no posts
}

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 1;
    postList.value = null;
    noMore.value = false;
  }

  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab and filter at the time of the request
  const currentContentType = activeContentType.value;
  const currentCollectionTab = activeCollectionTab.value;
  const currentSearchKeyword = searchKeyword.value;
  const currentDateRange = dateRange.value;

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

  // Ensure we have the latest country info before making the request
  await getCountry();

  try {
    // Use activeContentType as API type
    const type = activeContentType.value;

    // Format date range if provided
    let start = '';
    let end = '';
    if (dateRange.value && typeof dateRange.value === 'object') {
      start = dateRange.value.start;
      end = dateRange.value.end;
    }

    // Determine book_id for collections
    const book_id = activeCollectionTab.value !== 0 ? activeCollectionTab.value : '';

    let res;

    const showNsfw = userRegion.value ? (localStorage.getItem('allowSensitiveContent') == '1' ? 1 : 0) : undefined;
    if (isSelf.value) {
      res = await api.authorSelfCollection(
        type,
        page.value,
        limit.value,
      );
    } else {
      res = await api.authorCollection(
        type,
        page.value,
        limit.value,
        authorId,
        showNsfw
      );
    }

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      loading.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab or filter has changed while the request was in flight
    if (currentContentType !== activeContentType.value ||
        currentCollectionTab !== activeCollectionTab.value ||
        currentSearchKeyword !== searchKeyword.value ||
        JSON.stringify(currentDateRange) !== JSON.stringify(dateRange.value)) {
      loading.value = false;
      return; // Skip processing this response as the tab or filter has changed
    }

    const data = res as any;
    if (data.code === 200 || data.code === 0) {
        const newPosts = (data.data?.data || []).map((item: any) => {
          return {
            id: item.id,
            type: item.type === '1' ? 'image' : item.type === '2' ? 'article' : 'video',
            title: item.title || '',
            description: item.content || '',
            cover: item.cover || '',
            time: formatTimestamp(item.created_at),
          isPinned: item.is_top === '1' || false,
        };
      });

      if (!postList.value) {
          postList.value = [];
        }
        postList.value.push(...newPosts);

      // Set loading to false immediately after data is loaded
      loading.value = false;

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
      toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
      loading.value = false;
    }
  } catch (error) {
    console.error(error);
    toast(t('fail'))
    loading.value = false;
  }
}

function goDetail(id: number) {
  // Save current content type before navigating
  localStorage.setItem('userHomeContentType', activeContentType.value.toString());
  const queryParams: any = {
    id: id,
    type: 4,
    uid: route.query.id || ''
  };

  // if (searchKeyword.value) {
  //   queryParams.keyword = searchKeyword.value;
  // }

  // if (dateRange.value && dateRange.value.start && dateRange.value.end) {
  //   queryParams.start_day = dateRange.value.start;
  //   queryParams.end_day = dateRange.value.end;
  // }

  // if (activeContentType.value == 2) {
  //   router.push({
  //     path: '/novel-detail',
  //     query: queryParams
  //   });
  // } else {
  //   router.push({
  //     path: '/detail',
  //     query: queryParams
  //   });
  // }

  router.push({
    path: '/detail',
    query: queryParams
  });
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as Node;

  // Top menu
  if (moreMenuRef.value && !moreMenuRef.value.contains(target)) {
    showMoreMenu.value = false;
  }

  // Collection menu
  if (collectionMenuRef.value && !collectionMenuRef.value.contains(target)) {
    showCollectionMenu.value = false;
  }

  // Collection card menu
  if (activeCollectionMenuId.value !== null) {
    const el = collectionMenuRefs.get(activeCollectionMenuId.value);
    if (el && !el.contains(target)) {
      activeCollectionMenuId.value = null;
    }
  }
}

// Edit collection name
function editCollectionName() {
  if (currentCollection.value) {
    showCollectionMenu.value = false;

    editingCollectionId.value = currentCollection.value.id;
    editingCollectionName.value = currentCollection.value.title;
    editingCollectionCover.value = currentCollection.value.cover || '';
    editingCollectionDescription.value = currentCollection.value.description || '';
    showEditCollectionModal.value = true;
  }
}

// Handle edit collection save
function handleEditCollectionSave(collection: { id: string | number; name: string }) {
  showEditCollectionModal.value = false;

  // Update collection in collections array
  const index = collections.value.findIndex(col => col.id === collection.id);
  if (index !== -1) {
    collections.value[index].title = collection.name;
  }

  // Update collection tabs
  const tabIndex = collectionTabs.value.findIndex(tab => tab.id === collection.id);
  if (tabIndex !== -1) {
    const collectionData = collections.value.find(col => col.id === collection.id);
    if (collectionData) {
      collectionTabs.value[tabIndex].title = collection.name;
      collectionTabs.value[tabIndex].count = collectionData.chapters?.length || 0;
    }
  }
}

async function confirmReplacePin() {
  if (!selectedReplaceId.value || !pendingPinCollection.value) return;

  try {
    const newCollection = pendingPinCollection.value;
    const replaceId = selectedReplaceId.value;

    await api.postCollection({ book_id: newCollection.id, alter_id: replaceId?.toString() || '' });

    showPinLimitModal.value = false;
    pendingPinCollection.value = null;
    selectedReplaceId.value = null;

    await fetchCollections();
    showToast(t("userHome.collection.pinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}

// Collection methods
function createCollection() {
  router.push(`/create-collection?type=${activeContentType.value}`);
}

function goCollectionDetail(collectionId: number) {
  const authorId = route.query.id;
  const authorIdStr = Array.isArray(authorId) ? authorId[0] : authorId;
  router.push(`/collection/${collectionId}?uid=${authorIdStr}`);
}

function goCollectionSettings(collectionId: number) {
  localStorage.setItem('userHomeContentType', activeContentType.value.toString());
  router.push(`/collection-settings/${collectionId}`);
  activeCollectionMenuId.value = null;
}

function goChapterManage(collectionId: number) {
  localStorage.setItem('userHomeContentType', activeContentType.value.toString());
  const authorId = route.query.id;
  const authorIdStr = Array.isArray(authorId) ? authorId[0] : authorId;
  router.push(`/collection/${collectionId}?uid=${authorIdStr}`);
  activeCollectionMenuId.value = null;
}

function setCollectionMenuRef(el: any, id: string | number) {
  if (el && 'tagName' in el) {
    collectionMenuRefs.set(id, el as HTMLElement);
  }
}

function toggleCollectionMenu(id: string | number, event: MouseEvent) {
  event.stopPropagation();

  if (activeCollectionMenuId.value == id) {
    activeCollectionMenuId.value = null;
  } else {
    activeCollectionMenuId.value = id;
    showCollectionMenu.value = false;
  }
}

async function pinCollection(collection: any) {
  activeCollectionMenuId.value = null;

  const pinnedCount = pinnedCollections.value.length;
  if (pinnedCount >= 3) {
    pendingPinCollection.value = collection;
    selectedReplaceId.value = null;
    showPinLimitModal.value = true;
    return;
  }

  try {
    await api.postCollection({ book_id: collection.id });
    await fetchCollections();
    showToast(t("userHome.collection.pinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}

async function unpinCollection(collection: any) {
  activeCollectionMenuId.value = null;
  try {
    await api.postUnCollection({ book_id: collection.id });
    await fetchCollections();
    showToast(t("userHome.collection.unpinnedSuccess"));
  } catch (error) {
    console.error(error);
    toast(t('fail'));
  }
}
</script>

<style scoped lang="scss">
.user-homepage {
  min-height: 100vh;
  background: #FFFBF4;
  padding: 100px 16px 40px;

  @media (max-width: 768px) {
    padding: 80px 24px 40px;
  }

  @media (max-width: 420px) {
    padding: 60px 12px 30px;
  }
}

.home-bg {
  position: relative;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  height: 180px;
  border-radius: 6px;
  border: 2px solid #161122;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 253, 247, 0) 0%, #FFFDF7 100%);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.main-content {
  max-width: 1080px;
  margin: -10px auto 0;
  position: relative;
}

.user-info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 24px 0;

  .info-left {
    display: flex;
    align-items: center;
    width: 108px;
    height: 108px;
    line-height: 0;
    margin-top: -60px;
    position: relative;
    z-index: 2;

    .avatar {
      width: 108px;
      height: 108px;
      border-radius: 50%;
      border: 4px solid #161122;
      box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.2);
      object-fit: cover;
    }
  }

  .info-right {
    flex: 1;

    .text-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .text-info {
        .name-row {
          display: flex;
          align-items: center;
          .nickname {
            font-size: 26px;
            font-weight: 800;
            color: #161122;
          }
        }
        .kyc-row {
          display: flex;

          span{
            min-width: 56px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
            padding: 0 10px;
            border-radius: 6px;
            border: 2px solid #FF4D8D;
            font-size: 12px;
            background: rgba(255, 77, 141, 0.12);
            color: #FF4D8D;
          }
        }
        .id-row {
          font-size: 14px;
          color: #161122;
        }
      }

      .actions {
        display: flex;
        gap: 12px;
        align-items: center;

        .btn {
          min-width: 136px;
          height: 48px;
          padding: 0 10px;
          border-radius: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 2.5px solid #161122;

          &.edit {
            background: #FFFFFF;
            color: #161122;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);

            &:hover{
              background: #FFFDF7;
              box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
            }
          }

          &.follow {
            background: #FF4D8D;
            color: #FFFFFF;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
            position: relative;
            overflow: hidden;

            &:hover {
              box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
            }

            .hover-text {
              display: none;
            }

            &.followed {
              position: relative;
              background: #FFFDF7;
              color: #161122;

              &:hover {
                color: #FF4D8D;
                box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);

                .btn-text {
                  display: none;
                }
                .hover-text {
                  display: inline;
                }
              }
            }
          }

          &.subscribe {
            background: #FF4D8D;
            color: #FFFFFF;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
            padding: 0 20px;

            &:hover {
              box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
            }

            &.subscribed {
              position: relative;
              background: #FFFDF7;
              color: #161122;
              cursor: not-allowed;
              box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

              &:hover {
                box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);
              }
            }

            &:disabled {
              cursor: not-allowed;
            }
          }
          &.share {
            background: #FFFFFF;
            color: #161122;
            padding: 0 16px;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);

            .share-icon {
              display: inline-block;
              width: 24px;
              height: 24px;
              background-image: url('@/assets/images/user/share.png');
              background-size: cover;
            }

            &:hover {
              color: #FF4D8D;
              box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);

              .share-icon {
                background-image: url('@/assets/images/user/share_hover.png');
              }
            }
          }
          &.more {
            background: transparent;
            border: none;
            padding: 0;
            width: 32px;
            img {
              width: 24px;
              height: 24px;
            }
          }
        }

        .more-menu-wrap {
          position: relative;
          img {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            border-radius: 6px;
            border: 2.5px solid #161122;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
            padding: 6px 0;
            z-index: 10;
            min-width: 100px;
            background: #FFFDF7;

            &.bottom {
              top: 100%;
              margin-top: 4px;
            }
            &.top {
              bottom: 100%;
              margin-bottom: 4px;
            }

            .menu-item {
              padding: 6px 0;
              font-size: 14px;
              color: #161122;
              cursor: pointer;
              text-align: center;
              &:hover {
                font-weight: 800;
                color: #FF4D8D;
              }

              &.block-item {
                &.blocked {
                  color: #FF4D8D;
                }
              }
            }
          }
        }
      }
    }

    .desc-box {
      position: relative;
      margin-top: 20px;

      .desc-text {
        font-size: 14px;
        color: #161122;
        line-height: 20px;
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
        gap: 6px;
        margin-top: 10px;
        cursor: pointer;
        color: #FF4D8D;
        font-size: 14px;

        &.hide {
          color: #161122;
        }
        img {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  border-bottom: 1px solid #f2f4f7;

  .posts-title {
    display: flex;
    gap: 6px;
    border: 2.5px solid #161122;
    border-radius: 14px;
    padding: 5px;
    background: #FFFDF7;

    .type-item {
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 800;
      color: #161122;
      cursor: pointer;
      background: transparent;
      transition: background-color 0.2s, color 0.2s;


      &.active {
        background: #161122;
        color: #fff;
      }
    }
  }

  .stats-nums {
    display: flex;
    gap: 6px;
    border: 2.5px solid #161122;
    border-radius: 14px;
    padding: 5px;
    background: #FFFDF7;

    .stat-item {
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 14px;
      color: #161122;
      cursor: pointer;
      background: transparent;
      transition: background-color 0.2s, color 0.2s;

      &.active {
        background: #161122;
        color: #fff;

        .val {
          color: #fff;
        }
      }

      .label {
        font-weight: 500;
      }

      .val {
        font-weight: 800;
        margin-left: 4px;
      }
    }
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 8px;

  .collection-tabs-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .tab-prev-btn,
    .tab-next-btn {
      width: 20px;
      height: 20px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      cursor: pointer;
      flex-shrink: 0;

      img {
        width: 20px;
        height: 20px;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .tabs {
      display: flex;
      flex-wrap: nowrap;
      gap: 8px;
      height: 100%;

      &::-webkit-scrollbar {
        display: none;
      }

      .tab-item {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 148px;
        font-size: 14px;
        color: #161122;
        cursor: pointer;
        position: relative;
        padding: 8px 16px;
        border: 2.5px solid #161122;
        border-radius: 6px;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.15);
        background: #FFFDF7;
        white-space: nowrap;

        &.active {
          background: #FFFFFF;
          box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
        }

        .tab-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-count {
          margin-left: 4px;
          font-size: 12px;
          color: #161122;
        }
      }
    }
  }

  .filters {
    display: flex;
    gap: 20px;
    align-items: center;

    .sort-box {
      display: flex;

      .sort-btn {
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .more-menu-wrap {
      position: relative;
      img {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .dropdown-menu {
        position: absolute;
        right: 0;
        border-radius: 6px;
        border: 2.5px solid #161122;
        box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
        padding: 12px 8px;
        z-index: 10;
        min-width: 100px;
        width: max-content;
        background: #FFFDF7;

        &.bottom {
          top: 100%;
          margin-top: 6px;
        }
        &.top {
          bottom: 100%;
          margin-bottom: 6px;
        }

        .menu-item {
          margin-bottom: 12px;
          font-size: 14px;
          color: #161122;
          cursor: pointer;
          text-align: center;

          &:last-child{
            margin-bottom: 0;
          }

          &:hover {
            color: #FF4D8D;
          }
        }
      }
    }
  }
}

.posts-container {
  min-height: 400px;

  .waterfall {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;
    margin: 0 auto;
  }

  .post-card {
    width: 258px;

    .card-cover {
      position: relative;
      width: 100%;
      height: 344px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      img.cover-img {
        width: 100%;
        display: block;
        height: 344px;
        border-radius: 16px;
        border: 2.5px solid #161122;
        box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.2);
        object-fit: cover;
      }

      .video-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -42%);
        img {
          width: 80px;
          height: 80px;
        }
      }

      .pinned-tag {
        position: absolute;
        top: 8px;
        left: 8px;
        background: #FFFFFF;
        color: #161122;
        padding: 7px 10px;
        border-radius: 6px;
        border: 2px solid #161122;
        font-size: 12px;
        font-weight: 800;
      }
    }

    .card-info {
      padding: 12px 0 0;

      .card-desc {
        font-size: 14px;
        color: #161122;
        margin-bottom: 12px;
        line-height: 20px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .time {
          font-size: 12px;
          color: #161122;
        }

        .more-btn-wrap {
          position: relative;
          img {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            border-radius: 6px;
            border: 2.5px solid #161122;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
            padding: 6px 0;
            z-index: 10;
            min-width: 100px;
            background: #FFFDF7;

            &.bottom {
              top: 100%;
              margin-top: 4px;
            }
            &.top {
              bottom: 100%;
              margin-bottom: 4px;
            }

            .menu-item {
              padding: 6px 0;
              font-size: 14px;
              color: #161122;
              cursor: pointer;
              text-align: center;
              &:hover {
                font-weight: 800;
                color: #FF4D8D;
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
    color: #161122;
    font-size: 14px;
    padding: 40px 0;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e7e1d8;
    border-top: 3px solid #161122;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }

  .loading-text {
    font-size: 16px;
    color: #161122;
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
  background: #FFFDF7;
  border-radius: 16px;
  border: 2.5px solid #161122;
  box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.2);
  padding: 0 0 24px;
  min-height: 400px;

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e7e1d8;
    border-top: 3px solid #161122;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 16px;
  }

  .loading-text {
    font-size: 16px;
    color: #161122;
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
    padding: 80px 0;
    .hide-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
    p {
      font-weight: 800;
      font-size: 16px;
      color: #161122;
    }
  }

  .follow-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 24px;
  }

.follow-card {
      padding: 18px;
      border-radius: 16px;
      border: 3px solid #161122;
      box-shadow: 4px 4px 0 #161122;
      background: #FFFDF7;
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 6px 6px 0 #161122;
      }

    .card-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .user-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2.5px solid #161122;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.15);
        object-fit: cover;
      }
      .user-meta {
        flex: 1;
        .nickname {
          font-size: 14px;
          font-weight: 800;
          color: #161122;
          margin-bottom: 6px;
        }
        .fans-count {
          font-size: 12px;
          color: #161122;
        }
      }

      .follow-btn {
        min-width: 98px;
        height: 40px;
        padding: 0 16px;
        border-radius: 13px;
        border: 2.5px solid #161122;
        font-size: 14px;
        cursor: pointer;
        background: #FF4D8D;
        color: #FFFFFF;
        box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
        position: relative;
        overflow: hidden;

        &:hover {
          box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
        }

        .hover-text {
          display: none;
        }

        &.followed {
          background: #FFFDF7;
          color: #161122;
          box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);

          &:hover {
            color: #FF4D8D;
            box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);

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
      height: 36px;
      font-size: 12px;
      line-height: 18px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      color: #161122;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    padding-top: 24px;

    :deep(.el-pagination) {
      .el-pager li {
        background: transparent;
        &.is-active {
          color: #FF4D8D;
          font-weight: 800;
        }
        &:hover {
          color: #FF4D8D;
        }
      }
      button {
        background: transparent;
        &:hover {
          color: #FF4D8D;
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
  background: rgba(22, 17, 34, 0.3);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;

  .pin-modal {
    position: relative;
    width: 700px;
    background: #FFFDF7;
    border-radius: 16px;
    border: 2.5px solid #161122;
    box-shadow: 6px 6px 0 rgba(22, 17, 34, 0.2);
    padding: 18px 0;
    display: flex;
    flex-direction: column;

    .close-icon {
      position: absolute;
      top: 18px;
      right: 18px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px 18px;
      margin-bottom: 18px;
      border-bottom: 2.5px solid #161122;

      .title {
        font-size: 16px;
        font-weight: 800;
        color: #161122;
      }
    }

    .modal-desc {
      padding: 0 24px;
      font-size: 14px;
      color: #161122;
      margin-bottom: 18px;
    }

    .pinned-list {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
      padding: 0 24px 24px;
      border-bottom: 2.5px solid #161122;

      .pinned-item {
        flex: 1;
        cursor: pointer;

        .item-cover {
          width: 100%;
          margin-bottom: 12px;
          aspect-ratio: 3/4;
          object-fit: cover;
          border: 2.5px solid #161122;
          border-radius: 8px;
          box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.15);
          transition: all 0.2s;
        }

        .item-title {
          font-size: 14px;
          color: #161122;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &.selected {
          .item-cover {
            border-color: #FF4D8D;
            box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.3);
          }

          .item-title {
            color: #FF4D8D;
          }
        }
      }
    }

    .confirm-btn {
      align-self: center;
      width: 240px;
      height: 48px;
      background: #FF4D8D;
      color: #FFFFFF;
      border: 2.5px solid #161122;
      border-radius: 13px;
      box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
      font-size: 14px;
      cursor: pointer;

      &:disabled {
        background: rgba(255, 77, 141, 0.5);
        cursor: not-allowed;
        box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.1);
      }

      &:hover:not(:disabled) {
        box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
      }
    }
  }
}

.collections-container {
  min-height: 400px;

  .collections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
    gap: 16px;
  }

  .collection-card {
    background: #FFFDF7;
    border: 3px solid #161122;
    border-radius: 16px;
    box-shadow: 4px 4px 0 #161122;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 6px 6px 0 #161122;

      .cover-img {
        transform: scale(1.06);
      }
    }

    .card-cover {
      position: relative;
      width: 100%;
      height: 334px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      border-radius: 16px 16px 0 0;

      img.cover-img {
        width: 100%;
        display: block;
        height: 100%;
        border-radius: 0;
        border: none;
        box-shadow: none;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
      }

      .video-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -42%);
        img {
          width: 60px;
          height: 60px;
        }
      }

      .r18-overlay {
        position: absolute;
        top: 10px;
        right: 10px;
        height: 28px;
        background: rgba(16,24,40,0.7);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 8px;

        .r18-text {
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
        }
      }

      .pinned-tag {
        position: absolute;
        top: 10px;
        left: 10px;
        background: #FFD23F;
        color: #161122;
        padding: 3px 10px;
        border-radius: 999px;
        border: 2px solid #161122;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 2px 2px 0 #161122;
      }

      .card-bottom{
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 56px;
        display: flex;
        align-items: flex-end;
        padding: 0 12px 12px;
        border-radius: 0 0 0 0;
        background: linear-gradient(0deg, rgba(22, 17, 34, 0.2) 0%, rgba(22, 17, 34, 0) 100%);
      }

      .update-badge{
        font-size: 11px;
        color: #FFFFFF;
        font-weight: 700;
        text-shadow: 0 1px 3px rgba(22, 17, 34, 0.3);
      }

      .card-actions {
        margin-left: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .card-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #161122;
          background: rgba(255, 253, 247, 0.9);
          box-shadow: 2px 2px 0 rgba(22, 17, 34, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1);

          &:hover {
            transform: scale(1.1);
          }

          img {
            width: 14px;
            height: 14px;
          }
        }
      }
    }

    .card-info {
      padding: 12px 14px 14px;

      .card-desc {
        font-size: 14px;
        font-weight: 800;
        color: #161122;
        margin-bottom: 0;
        line-height: 20px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e7e1d8;
  border-top: 3px solid #161122;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
  border-top-width: 2px;
}

.loading-text {
  font-size: 16px;
  color: #161122;
}

.block-tip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: -8px;
  padding: 10px;
  background: #161122;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.3);
  color: #FFFDF7;
  border-radius: 6px;
  border: 2px solid #161122;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  z-index: 10;
  text-align: center;
  width: 220px;
  white-space: normal;
  word-break: break-word;
}

.blocked-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150px 0;
  text-align: center;

  .blocked-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    color: #161122;
    line-height: 16px;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  color: #161122;
  font-size: 14px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.collection-card {
  animation: cardIn 480ms cubic-bezier(0.16,1,0.3,1) backwards;
}

.follow-card {
  animation: cardIn 480ms cubic-bezier(0.16,1,0.3,1) backwards;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 420px) {
  .user-info-card {
    flex-direction: column;
    .info-left {
      width: 72px;
      height: 72px;
      margin-top: -40px;
      .avatar {
        width: 72px;
        height: 72px;
      }
    }
    .info-right .text-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      .text-info .name-row .nickname {
        font-size: 20px;
      }
      .actions {
        flex-wrap: wrap;
        .btn {
          min-width: 100px;
          height: 40px;
          font-size: 13px;
        }
      }
    }
  }
  .stats-bar {
    flex-direction: column;
    gap: 12px;
    .posts-title .type-item {
      padding: 8px 14px;
      font-size: 13px;
    }
    .stats-nums .stat-item {
      padding: 8px 12px;
      font-size: 13px;
    }
  }
  .collections-container .collections-grid {
    gap: 12px;
  }
  .collection-card {
    width: calc(50% - 6px);
  }
  .follow-container .follow-list {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  .pin-modal-overlay .pin-modal {
    width: calc(100vw - 32px);
  }
  .block-confirm-modal .modal-content {
    width: calc(100vw - 32px);
  }
}

.collection-header {
  display: flex;
  align-items: center;

  .create-collection-btn {
    display: flex;
    align-items: center;
    height: 40px;
    gap: 6px;
    padding: 0 20px;
    background: #FFFDF7;
    color: #161122;
    border: 2.5px solid #161122;
    border-radius: 13px;
    box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);
    font-size: 14px;
    cursor: pointer;

    &:hover{
      color: #FF4D8D;
      box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
    }

    .plus-icon {
      width: 20px;
      height: 20px;
    }
  }
}

@media (max-width: 768px) {
  .home-bg {
    height: 120px;
  }

  .user-info-card {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0;

    .info-left {
      width: 80px;
      height: 80px;
      margin-top: -40px;

      .avatar {
        width: 80px;
        height: 80px;
        border-width: 3px;
      }
    }

    .info-right {
      width: 100%;

      .text-inner {
        flex-direction: column;
        align-items: center;
        gap: 12px;

        .text-info {
          .name-row {
            .nickname {
              font-size: 20px;
            }
          }
          .kyc-row {
            span {
              height: 24px;
              font-size: 11px;
              min-width: 48px;
              margin-top: 4px;
            }
          }
        }

        .actions {
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;

          .btn {
            min-width: 100px;
            height: 40px;
            font-size: 13px;
            padding: 0 8px;

            &.subscribe {
              padding: 0 12px;
            }
          }
        }
      }

      .desc-box {
        margin-top: 12px;
        text-align: center;
      }
    }
  }

  .stats-bar {
    flex-direction: column;
    gap: 12px;

    .posts-title {
      justify-content: center;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px;

      .type-item {
        padding: 8px 14px;
        font-size: 13px;
      }
    }

    .stats-nums {
      justify-content: center;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px;

      .stat-item {
        padding: 8px 10px;
        font-size: 13px;
      }
    }
  }

  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 16px;

    .collection-tabs-container {
      .tabs {
        .tab-item {
          width: 120px;
          font-size: 12px;
          padding: 6px 10px;
        }
      }
    }
  }

  .collections-container {
    .collection-card {
      width: 100%;
      max-width: 100%;
    }
  }

  .follow-container {
    .follow-list {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }

    .follow-card {
      padding: 12px;

      .card-top {
        flex-wrap: wrap;
        gap: 8px;

        .user-avatar {
          width: 40px;
          height: 40px;
        }
        .user-meta {
          .nickname {
            font-size: 13px;
          }
          .fans-count {
            font-size: 11px;
          }
        }

        .follow-btn {
          min-width: 80px;
          height: 34px;
          font-size: 12px;
          padding: 0 10px;
        }
      }

      .card-bio {
        font-size: 11px;
        height: 30px;
        line-height: 15px;
      }
    }
  }

  .pin-modal-overlay {
    .pin-modal {
      width: calc(100vw - 32px);
      max-width: 700px;
      padding: 14px 0;

      .close-icon {
        top: 14px;
        right: 14px;
        width: 16px;
        height: 16px;
      }

      .modal-header {
        padding: 0 16px 14px;
        margin-bottom: 14px;

        .title {
          font-size: 14px;
        }
      }

      .modal-desc {
        padding: 0 16px;
        font-size: 13px;
        margin-bottom: 14px;
      }

      .pinned-list {
        gap: 8px;
        padding: 0 16px 16px;
        flex-wrap: wrap;

        .pinned-item {
          .item-title {
            font-size: 12px;
          }
        }
      }

      .confirm-btn {
        width: 180px;
        height: 42px;
        font-size: 13px;
      }
    }
  }

  .block-confirm-modal {
    .modal-content {
      width: calc(100vw - 32px);
      max-width: 500px;
      padding: 14px 16px 20px;

      .modal-title {
        font-size: 16px;
      }

      .modal-message {
        font-size: 13px;
        margin-bottom: 20px;
      }

      .modal-footer {
        gap: 12px;

        .btn {
          min-width: 120px;
          height: 40px;
          font-size: 13px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .user-homepage {
    padding: 70px 16px 30px;
  }

  .home-bg {
    height: 90px;
    border-radius: 4px;
  }

  .user-info-card {
    .info-left {
      width: 64px;
      height: 64px;
      margin-top: -32px;

      .avatar {
        width: 64px;
        height: 64px;
        border-width: 2px;
      }
    }

    .info-right {
      .text-inner {
        .text-info {
          .name-row {
            .nickname {
              font-size: 18px;
            }
          }
        }

        .actions {
          .btn {
            min-width: 80px;
            height: 36px;
            font-size: 12px;
            gap: 6px;
          }
        }
      }
    }
  }

  .stats-bar {
    .posts-title {
      .type-item {
        padding: 6px 10px;
        font-size: 12px;
      }
    }

    .stats-nums {
      .stat-item {
        padding: 6px 8px;
        font-size: 12px;
      }
    }
  }

  .collections-container {
    .collection-card {
      width: 100%;
      max-width: 100%;

      .card-cover {

        .r18-overlay {
          height: 24px;
          border-radius: 12px;
          padding: 0 6px;

          .r18-text {
            font-size: 12px;
          }
        }

        .pinned-tag {
          font-size: 10px;
          padding: 2px 6px;
        }

        .card-bottom {
          height: 44px;
          padding: 0 8px 8px;

          .update-badge {
            font-size: 10px;
          }

          .card-actions {
            .card-action-btn {
              width: 24px;
              height: 24px;

              img {
                width: 12px;
                height: 12px;
              }
            }
          }
        }
      }

      .card-info {
        padding: 8px 10px 10px;

        .card-desc {
          font-size: 12px;
          line-height: 16px;
        }
      }
    }
  }

  .follow-container {
    .follow-list {
      grid-template-columns: 1fr;
      gap: 10px;
      padding: 12px;
    }
  }

  .collection-header {
    .create-collection-btn {
      height: 36px;
      padding: 0 14px;
      font-size: 12px;

      .plus-icon {
        width: 16px;
        height: 16px;
      }
    }
  }
}

.block-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(22, 17, 34, 0.3);
  }

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    max-width: calc(100vw - 32px);
    background-color: #FFFDF7;
    border-radius: 16px;
    border: 2.5px solid #161122;
    box-shadow: 6px 6px 0 rgba(22, 17, 34, 0.2);
    padding: 18px 24px 24px;
    text-align: center;

    .close-btn {
      position: absolute;
      top: 20px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #161122;
      margin-bottom: 16px;
    }

    .modal-message {
      font-size: 14px;
      color: #161122;
      line-height: 16px;
      margin-bottom: 24px;
    }

    .modal-footer {
      display: flex;
      gap: 16px;
      justify-content: center;

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 136px;
        height: 44px;
        border-radius: 13px;
        font-size: 14px;
        cursor: pointer;
        border: 2.5px solid #161122;

        &.btn-cancel {
          background: #FFFDF7;
          color: #161122;
          box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);

          &:hover {
            color: #FF4D8D;
            box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
          }
        }

        &.btn-confirm {
          background: #FF4D8D;
          color: #FFFFFF;
          box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.2);

          &:hover {
            box-shadow: 4px 4px 0 rgba(22, 17, 34, 0.25);
          }
        }
      }
    }
  }
}
</style>