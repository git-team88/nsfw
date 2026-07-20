<template>
  <div class="user-messages">
    <Header :cur="-1" @messageInfoLoaded="handleMessageInfoLoaded" ref="headerRef"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.messages.title") }}</div>
        </div>
        <div class="content">

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

    const r = res as any;
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
      toast(locale.value == 'en' ? r.msg : locale.value == 'zh' ? r.msg_cn : locale.value == 'tc' ? r.msg_tc : r.msg_jp);
    }
  } catch (e) {
    console.error(e);
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.user-messages {
  width: 100%;
  min-height: 100vh;
  background: #FFFBF4;
}
.container {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 100px 30px 24px;
}
.main {
  flex: 1;
  padding: 24px;
  border: 3px solid #161122;
  border-radius: 14px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
}
.content {
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #161122;
  position: relative;
  padding-bottom: 10px;
}
.panel-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #FF4D8D;
}
.tabs {
  display: inline-flex;
  gap: 6px;
  border: 2px solid #161122;
  border-radius: 14px;
  padding: 5px;
  margin-bottom: 24px;
}
.tab-item {
  font-size: 16px;
  color: #161122;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.tab-item.active {
  background: #161122;
  color: #fff;
  border-radius: 10px;
  font-weight: 800;
}
.tab-item .count-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 9px;
  height: 9px;
  margin-left: 6px;
  padding: 2px 6px;
  background: #FF4D8D;
  color: #ffffff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
  animation: pulse 1.5s ease-in-out infinite;
}
.content-area {
  min-height: 400px;
}
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  font-size: 14px;
  color: #161122;
  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e7e1d8;
    border-top: 3px solid #161122;
    border-radius: 50%;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 12px;
  }
}
.pagination-wrap {
  margin-top: 24px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
  padding: 24px;
  }
}

@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .content {
    padding: 16px;
  }
  .tabs {
    flex-wrap: wrap;
    gap: 4px;
  }
  .tab-item {
    font-size: 14px;
    padding: 6px 12px;
  }
}
</style>
