<template>
  <div class="user-messages">
    <Header :cur="-1" @messageInfoLoaded="handleMessageInfoLoaded" ref="headerRef"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.messages.title") }}</div>
          </div>

          <div class="tabs">
            <div class="tab-item" :class="{ active: activeTab == 0 }" @click="switchTab(0)">
              {{ t("user.messages.tab1") }}
              <span v-if="newsCounts.expiring > 0" class="count-dot">{{ newsCounts.expiring }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab == 1 }" @click="switchTab(1)">
              {{ t("user.messages.tab2") }}
              <span v-if="newsCounts.follow > 0" class="count-dot">{{ newsCounts.follow }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab == 2 }" @click="switchTab(2)">
              {{ t("user.messages.tab3") }}
              <span v-if="newsCounts.subscription > 0" class="count-dot">{{ newsCounts.subscription }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab == 3 }" @click="switchTab(3)">
              {{ t("user.messages.tab4") }}
              <span v-if="newsCounts.like > 0" class="count-dot">{{ newsCounts.like }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab == 4 }" @click="switchTab(4)">
              {{ t("user.messages.tab5") }}
              <span v-if="newsCounts.comment > 0" class="count-dot">{{ newsCounts.comment }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab == 5 }" @click="switchTab(5)">
              {{ t("user.messages.tab6") }}
              <span v-if="newsCounts.mention > 0" class="count-dot">{{ newsCounts.mention }}</span>
            </div>
          </div>

          <div v-if="loading" class="loading-box">
            <div class="loading-spinner"></div>
            <span>{{ t('home.loading') }}</span>
          </div>
          <div class="content-area" v-else>
            <SubscriptionExpiring v-if="activeTab === 0" :list="listData" />
            <Follow v-if="activeTab === 1" :list="listData" />
            <NewSubscriptions v-if="activeTab === 2" :list="listData" />
            <Likes v-if="activeTab === 3" :list="listData" />
            <Comments v-if="activeTab === 4" :list="listData" />
            <Mentions v-if="activeTab === 5" :list="listData" />
          </div>

          <div class="pagination-wrap" v-if="!loading && total > pageSize">
            <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserMessages">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import Pagination from "@/components/Pagination.vue";
import SubscriptionExpiring from "./messages/SubscriptionExpiring.vue";
import NewSubscriptions from "./messages/NewSubscriptions.vue";
import Likes from "./messages/Likes.vue";
import Comments from "./messages/Comments.vue";
import Follow from "./messages/Follow.vue";
import Mentions from "./messages/Mentions.vue";

import { ref, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import api from "@/api/index";
import { toast } from "@/util/toast";

const emit = defineEmits(['messageInfoUpdated']);

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const sidebarKey = ref("messages");
const activeTab = ref(0);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const listData = ref<Record<string, unknown>[]>([]);
const loading = ref(false);

// Request identifier to avoid race conditions
const currentRequestId = ref(0);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

// Message counts for each tab
const newsCounts = ref({
  expiring: 0,
  follow: 0,
  subscription: 0,
  like: 0,
  comment: 0,
  mention: 0,
});

// Handle message info loaded from Header component
function handleMessageInfoLoaded(messageInfo: any) {
  newsCounts.value = messageInfo;
}

// Handle message info updated from child components
function handleMessageInfoUpdated(updatedCounts: any) {
  newsCounts.value = updatedCounts;
  // Emit event to update Header
  emit('messageInfoUpdated', updatedCounts);
}

function switchTab(idx: number) {
  if (activeTab.value === idx) return;
  activeTab.value = idx;
  page.value = 1;

  // Update URL with the new tab value
  router.replace({
    path: '/user-message',
    query: { tab: idx.toString() }
  });

  fetchData();
}

watch(page, () => {
  fetchData();
});

onMounted(() => {
  window.scrollTo(0, 0);
  if (route.query.tab !== undefined) {
    activeTab.value = parseInt(route.query.tab as string);
  }
  fetchData();
});

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab !== undefined) {
      const tabIndex = parseInt(newTab as string);
      if (activeTab.value !== tabIndex) {
        activeTab.value = tabIndex;
        page.value = 1;
        fetchData();
      }
    }
  }
);

async function fetchData() {
  // Generate a unique request ID for this request
  const requestId = ++currentRequestId.value;
  // Store the current tab at the time of the request
  const currentTab = activeTab.value;
  const currentPage = page.value;

  loading.value = true;
  listData.value = [];

  try {
    let res;
    let countKey: keyof typeof newsCounts.value;

    switch (activeTab.value) {
      case 0: // Subscription Expiring
        res = await api.messageExpireList(page.value, pageSize.value);
        countKey = 'expiring';
        break;
      case 1: // Follow
        res = await api.messageFollowList(page.value, pageSize.value);
        countKey = 'follow';
        break;
      case 2: // New Subscriptions
        res = await api.messageSubscribeList(page.value, pageSize.value);
        countKey = 'subscription';
        break;
      case 3: // Likes
        res = await api.messageLikeList(page.value, pageSize.value);
        countKey = 'like';
        break;
      case 4: // Comments
        res = await api.messageCommentList(page.value, pageSize.value);
        countKey = 'comment';
        break;
      case 5: // Mentions
        res = await api.messageMentionsList(page.value, pageSize.value);
        countKey = 'mention';
        break;
      default:
        return false;
    }

    // Check if this request is still the latest one
    if (requestId !== currentRequestId.value) {
      loading.value = false;
      return; // Skip processing this response as it's outdated
    }

    // Check if the tab or page has changed while the request was in flight
    if (currentTab !== activeTab.value || currentPage !== page.value) {
      loading.value = false;
      return; // Skip processing this response as the tab or page has changed
    }

    const r = res as unknown as {
      code: number;
      msg?: string;
      data?: { data: Record<string, unknown>[]; allnums: number };
    };
    if (r.code === 0 || r.code === 200) {
      listData.value = r.data?.data || [];
      total.value = r.data?.allnums || 0;

      // Clear the unread count for this tab
      newsCounts.value[countKey] = 0;

      // Refresh message info to update Header
      try {
        // Call getMessageInfo directly on Header component
        if (headerRef.value) {
          headerRef.value.getMessageInfo();
        }
      } catch (error) {
        console.error('Error updating message info:', error);
      }
    } else {
      toast(r.msg || "Error");
    }
  } catch (e) {
    console.error(e);
    toast("Failed to fetch data");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.user-messages {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 6rem;
  padding-right: 6rem;
}
.main {
  flex: 1;
  padding: 14rem 0 2rem;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.4rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}

.tabs {
  display: flex;
  gap: 3.2rem;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 2.4rem;
}
.tab-item {
  font-size: 1.6rem;
  color: #6A7282;
  padding-bottom: 1.8rem;
  cursor: pointer;
  position: relative;

  &:hover{
    color: #101828;
  }
}
.tab-item.active {
  color: #101828;
  font-weight: 500;
}
.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #fb64b6;
  border-radius: 2px;
}

.tab-item .count-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  min-height: 1.6rem;
  margin-left: 0.6rem;
  padding: 0.1rem 0.6rem 0.3rem;
  background: #fa2d47;
  color: #ffffff;
  border-radius: 0.8rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.content-area {
  min-height: 40rem;
}
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40rem;
  font-size: 1.4rem;
  color: #99a1af;

  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 0.4rem solid #F5F5F5;
    border-top: 0.4rem solid #6A7282;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1.2rem;
  }
}
.pagination-wrap {
  margin-top: 2.4rem;
}
</style>
