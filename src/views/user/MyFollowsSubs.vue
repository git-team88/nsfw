<template>
  <div class="user-my-follows-subs">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel-top">
          <div class="panel-title">{{ t("user.myFollowsSubs.title") }}</div>
        </div>
        <div class="content">

          <div class="tabs">
            <div class="tab-item" :class="{ active: activeTab === 0 }" @click="switchTab(0)">
              {{ t("user.myFollowsSubs.tabSubs") }}
            </div>
            <div class="tab-item" :class="{ active: activeTab === 1 }" @click="switchTab(1)">
              {{ t("user.myFollowsSubs.tabFollows") }}
            </div>
          </div>

          <div class="loading-box" v-if="loading">
            <img src="@/assets/images/base/load.png" alt="" />
          </div>

          <template v-else>
            <div class="list-area" v-if="activeTab === 1">
              <div class="follow-item" v-for="item in listData" :key="item.id">
                <div class="left">
                  <img class="avatar" :src="item.avatar" alt="" @click="goUserHome(item.userId)" />
                  <div class="info">
                    <div class="name">{{ item.name }}</div>
                    <div class="id">ID:{{ item.userId }}</div>
                  </div>
                </div>
                <div class="right">
                  <button class="follow-btn following">
                    <span class="text">{{ t("user.myFollowsSubs.following") }}</span>
                    <span class="hover-text">{{ t("user.myFollowsSubs.unfollow") }}</span>
                  </button>
                </div>
              </div>
              <EmptyState v-if="!listData.length" />
            </div>

            <div class="list-area" v-if="activeTab === 0">
              <div class="sub-item" v-for="item in listData" :key="item.id">
                <div class="left">
                  <img class="avatar" :src="item.avatar" alt="" @click="goUserHome(item.userId)" />
                  <div class="info">
                    <div class="name">{{ item.name }}</div>
                    <div class="id">ID:{{ item.userId }}</div>
                  </div>
                </div>
                <div class="right">
                  <div class="price-info">
                    <div class="price">${{ item.isWeb3 ? trimZeros(item.web3Price) : item.price }}{{ item.isWeb3 ? ' USDT' : '' }}/Month</div>
                    <div class="date">
                      {{
                        t("user.myFollowsSubs.validDate", {
                          start: item.startTime,
                          end: item.endTime,
                        })
                      }}
                    </div>
                  </div>

                  <!-- <div class="operate-box">
                    <div class="more-box" v-if="item.autoRenew">
                      <img
                        class="more-icon"
                        src="@/assets/images/detail/menu.png"
                        alt=""
                        @click="toggleMoreMenu(item.id, $event)"
                      />
                      <div class="more-menu" v-if="showMoreIndex === item.id" :style="menuStyle">
                        <div class="menu-item" @click="toggleAutoRenew(item)">
                          {{ t("user.myFollowsSubs.autoRenewOff") }}
                        </div>
                      </div>
                    </div>

                    <div class="menu-auto" @click="toggleAutoRenew(item)" v-else>
                      <b></b>
                      {{ t("user.myFollowsSubs.autoRenewOn") }}
                    </div>
                  </div> -->
                </div>
              </div>
              <EmptyState v-if="!listData.length" />
            </div>

            <div class="pagination-wrap" v-if="total > pageSize">
              <Pagination :total="total" :pageSize="pageSize" v-model="page" theme="pink" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import EmptyState from "@/components/EmptyState.vue";
import Pagination from "@/components/Pagination.vue";
import { ref, onMounted, onBeforeUnmount, watch, type CSSProperties } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { toast } from "@/util/toast";
import api from "@/api/index";
import { formatTimestamp } from "@/util/utils";

const { t, locale } = useI18n();

function trimZeros(val: string | number): string {
  const s = String(val);
  if (s === '' || s === '0') return s;
  const num = parseFloat(s);
  if (isNaN(num)) return s;
  return num.toString();
}

const router = useRouter();
const sidebarKey = ref("myfollows-subs");
const activeTab = ref(0);
const showMoreIndex = ref(-1);
const menuStyle = ref<CSSProperties>({});

function toggleMoreMenu(id: number, event: MouseEvent) {
  if (showMoreIndex.value === id) {
    showMoreIndex.value = -1;
    return;
  }
  showMoreIndex.value = id;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const screenHeight = window.innerHeight;
  const menuHeight = 40; // Estimated height

  if (rect.bottom + menuHeight > screenHeight) {
    menuStyle.value = {
      bottom: "100%",
      top: "auto",
      marginTop: "0",
      marginBottom: "0.4rem",
    };
  } else {
    menuStyle.value = {
      top: "100%",
      bottom: "auto",
      marginTop: "0.4rem",
      marginBottom: "0",
    };
  }
}

const loading = ref(false);
const listData = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

function switchTab(tab: number) {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  page.value = 1;
  fetchData();
}

async function fetchData() {
  loading.value = true;
  listData.value = [];
  total.value = 0;

  try {
    let res;
    if (activeTab.value === 0) {
      res = await api.userSubscribeList(page.value, pageSize.value) as any;
    } else {
      res = await api.userFollowList(page.value, pageSize.value) as any;
    }

    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data || [];
      total.value = res.data?.total || res.data?.allnums || 0;

      listData.value = data.map((item: any) => {
        if (activeTab.value === 1) {
          return {
            id: item.followed_id || item.id,
            userId: item.user_info?.id || item.userId,
            name: item.user_info?.nickname || item.name,
            avatar: item.user_info?.avatar || item.avatar || '',
            price: 0,
            startTime: '',
            endTime: '',
            autoRenew: false,
          };
        } else {
          return {
            id: item.id,
            userId: item.author?.id || item.author_id,
            name: item.author?.nickname || '',
            avatar: item.author?.avatar || '',
            price: item.plan?.price || 0,
            web3Price: item.plan?.web3?.price || '',
            startTime: formatTimestamp(item.created_at) || '',
            endTime: formatTimestamp(item.expire_at) || '',
            autoRenew: item.auto_renew || false,
            isWeb3: (item.stripe_subscription_id || '').toLowerCase().startsWith('web3'),
          };
        }
      });
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    loading.value = false;
  }
}

watch(page, () => {
  fetchData();
});

function toggleAutoRenew(item: any) {
  item.autoRenew = !item.autoRenew;
  showMoreIndex.value = -1;
}

function goUserHome(userId: string) {
  router.push(`/user-home?id=${userId}`);
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest(".more-box")) {
    showMoreIndex.value = -1;
  }
}

onMounted(() => {
  fetchData();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.user-my-follows-subs {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
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
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
}
.content {
  min-height: calc(100vh - 140px);
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
  padding: 0 36px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #f5f5f5;
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
  background: #ff4f9a;
}

.tabs {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  border-bottom: 1px solid #303030;
  padding: 0;
  margin-bottom: 24px;
  margin-left: 36px;
  background: transparent;
}
.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 8px;
  font-size: 15px;
  font-weight: 900;
  color: #555;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s;
  &.active {
    color: #e7e7e7;

    &::after {
      content: "";
      position: absolute;
      right: 8px;
      bottom: -1px;
      left: 8px;
      height: 4px;
      border-radius: 4px 4px 0 0;
      background: #ff4f9a;
    }
  }
  &:hover:not(.active) {
    color: #aaa;
  }
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  img {
    width: 40px;
    height: 40px;
    animation: rotate 1.5s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.list-area {
  display: flex;
  flex-direction: column;
  padding: 0 36px;
  gap: 12px;
  min-height: 400px;
}

.pagination-wrap {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.follow-item,
.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 18px 18px;
  border: 1px solid #3d3d3d;
  border-radius: 13px;
  background: #1a1a1a;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    box-shadow: none;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 12px;
    .avatar {
      width: 52px;
      height: 52px;
      border: 1px solid #3d3d3d;
      border-radius: 50%;
      object-fit: cover;
    }
    .info {
      .name {
        max-width: 600px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 16px;
        font-weight: 800;
        color: #f5f5f5;
      }
      .id {
        font-size: 14px;
        color: #f5f5f5;
        opacity: 0.6;
        margin-top: 4px;
      }
    }
  }
}

.follow-btn {
  min-width: 112px;
  height: 40px;
  border-radius: 13px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  border: 2px solid #ff9aca;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  border: 2px solid #ff9aca;
  color: #f5f5f5;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.15s ease;

  &.following {
    .hover-text {
      display: none;
    }
    &:hover {
      background: rgba(255,255,255,0.08);
      color: #ff4f9a;
      .text {
        display: none;
      }
      .hover-text {
        display: inline;
      }
    }
  }
}

.sub-item {
  .right {
    display: flex;
    align-items: center;
    gap: 24px;
    .price-info {
      text-align: right;
      .price {
        font-size: 16px;
        color: #ff4f9a;
        font-weight: 800;
      }
      .date {
        font-size: 14px;
        color: #f5f5f5;
        opacity: 0.6;
        margin-top: 4px;
      }
    }

    .operate-box {
      .more-box {
        position: relative;
        .more-icon {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .more-menu {
           position: absolute;
           right: 0;
           top: 22px;
           display: flex;
           align-items: center;
           justify-content: center;
           width: auto;
           min-width: 160px;
           background: #1a1a1a;
   border: 1px solid #3d3d3d;
           border-radius: 10px;
           z-index: 10;
          .menu-item {
            padding: 8px 10px;
            font-size: 12px;
            font-weight: 800;
            color: #f5f5f5;
            cursor: pointer;
          }
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 14px;
        font-weight: 800;
        color: #ff4f9a;

        b {
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.08);
        }
      }
    }
  }
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 20px 24px;
  }
  .main {
  padding: 24px;
  margin-left: 0;
  }
  .panel-top {
    padding: 0 20px;
  }
  .tabs {
    margin-left: 20px;
  }
  .list-area {
    padding: 0 20px;
  }
  .follow-item,
  .sub-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  .sub-item .right {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 420px) {
  .container {
    padding: 0 12px;
  }
  .panel-top {
    padding: 0 16px;
  }
  .tabs {
    margin-left: 16px;
  }
  .list-area {
    padding: 0 16px;
  }
  .follow-item,
  .sub-item {
    padding: 14px 16px;
  }
  .follow-item .left .info .name,
  .sub-item .left .info .name {
    max-width: 200px;
  }
  .follow-btn {
    min-width: 90px;
    height: 36px;
    font-size: 13px;
  }
}
</style>
