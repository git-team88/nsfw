<template>
  <div class="user-my-follows-subs">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.myFollowsSubs.title") }}</div>
          </div>

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
                    <div class="price">${{ item.price }}/Month</div>
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
            startTime: item.created_at || '',
            endTime: formatTimestamp(item.expire_at) || '',
            autoRenew: item.auto_renew || false,
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
  background: #FFFFFF;
}
.container {
  max-width: 139.2rem;
  margin: 0 auto;
  display: flex;
  gap: 2.4rem;
}
.main {
  flex: 1;
  padding-top: 12rem;
}
.panel {
  min-height: calc(100vh - 14rem);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
  padding: 2.4rem 0;
}
.panel-top {
  margin-bottom: 2.4rem;
  padding: 0 3.6rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}

.tabs {
  display: flex;
  gap: 3.2rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.2);
  margin-bottom: 2.4rem;
  padding: 0 3.6rem;
}
.tab-item {
  padding-bottom: 1.8rem;
  font-size: 1.6rem;
  color: #6a7282;
  cursor: pointer;
  position: relative;
  &.active {
    color: #101828;
    font-weight: 500;
    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background: #fb64b6;
      border-radius: 2px;
    }
  }
}

.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40rem;
  img {
    width: 4rem;
    height: 4rem;
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
  padding: 0 3.6rem;
  gap: 1.2rem;
  min-height: 40rem;
}

.pagination-wrap {
  margin-top: 4rem;
  display: flex;
  justify-content: center;
}

.follow-item,
.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.8rem 2.4rem 1.8rem 1.8rem;
  border: 1px solid rgba(251, 100, 182, 0.1);
  border-radius: 0.8rem;
  cursor: pointer;

  &:hover {
    box-shadow: 0px 0px 12px 0px rgba(251, 100, 182, 0.06);
  }
  .left {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    .avatar {
      width: 5.2rem;
      height: 5.2rem;
      border-radius: 0.8rem;
      object-fit: cover;
    }
    .info {
      .name {
        max-width: 60rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 1.6rem;
        color: #101828;
      }
      .id {
        font-size: 1.4rem;
        color: #99a1af;
        margin-top: 0.8rem;
      }
    }
  }
}

.follow-btn {
  min-width: 11.2rem;
  height: 4rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  cursor: pointer;
  border: 1px solid rgba(251, 100, 182, 0.2);
  background: none;
  color: rgba(251, 100, 182, 0.5);
  position: relative;
  overflow: hidden;

  &.following {
    .hover-text {
      display: none;
    }
    &:hover {
      background: rgba(251, 100, 182, 0.06);
      border-color: #fb64b6;
      color: #fb64b6;
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
    gap: 2.4rem;
    .price-info {
      text-align: right;
      .price {
        font-size: 1.6rem;
        color: #fb64b6;
        font-weight: 500;
      }
      .date {
        font-size: 1.4rem;
        color: #99a1af;
        margin-top: 0.4rem;
      }
    }

    .operate-box {
      .more-box {
        position: relative;
        .more-icon {
          width: 2.4rem;
          height: 2.4rem;
          cursor: pointer;
        }
        .more-menu {
          position: absolute;
          right: 0;
          top: 2.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: auto;
          min-width: 16rem;
          background: #ffffff;
          border: 1px solid rgba(251, 100, 182, 0.2);
          border-radius: 0.6rem;
          box-shadow: 0px 0px 15px -3px rgba(0, 0, 0, 0.08);
          z-index: 10;
          .menu-item {
            padding: 0.8rem 1rem;
            font-size: 1.2rem;
            color: #6a7282;
            cursor: pointer;
          }
        }
      }

      .menu-auto {
        display: flex;
        align-items: center;
        gap: 2.4rem;
        font-size: 1.4rem;
        color: #00d3f2;

        b {
          width: 1px;
          height: 2.4rem;
          background: rgba(251, 100, 182, 0.2);
        }
      }
    }
  }
}
</style>
