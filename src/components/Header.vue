<template>
  <div class="header">
    <div class="container">
      <div class="left">
        <div class="logo" @click="goHome">
          <img src="@/assets/images/header/logo.png" />
        </div>

        <div class="nav" v-if="isLogin">
          <div
            class="nav-item"
            :class="{ on: cur == index }"
            v-for="(item, index) in navList"
            :key="index"
            @click="goNav(item, index)"
          >
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div class="right">
        <div class="header-news-box" v-if="isLogin">
          <div class="header-news" @click="showNewsMenu()">
            <span class="news-icon" alt=""></span>
            <span class="circle" v-if="unTotal > 0"></span>
          </div>
          <div class="news-dropdown" v-if="isShowNewsMenu">
            <div
              class="news-item"
              v-for="(item, index) in newsMenuList"
              :key="index"
              @click="goNews(item)"
            >
              <span>{{ t(item.label) }}</span>
              <span class="count-dot" v-if="item.count > 0">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="language">
          <span class="language-icon" @click="showLang"></span>

          <div class="language-select" v-if="isShowLang">
            <span
              :class="langText == lang.toLocaleLowerCase() ? 'on' : ''"
              v-for="(lang, index) in langList"
              :key="index"
              @click="changeLang(lang)"
              >{{ lang }}</span
            >
          </div>
        </div>

        <div class="header-bean-box" v-if="isLogin">
          <div class="header-bean">
            <img src="../assets/images/header/bean_icon.png" alt="" />
            <span>{{ bean }}</span>
          </div>

          <span class="header-line"></span>

          <span class="header-recharge" @click="goRecharge">{{ t("header.recharge") }}</span>
        </div>

        <div class="header-contribution-box" v-if="isLogin">
          <div class="header-contribution" @click="showContribution()">
            {{ t("header.contribution") }}
          </div>

          <div class="header-contribution-info" v-if="isShowContribution">
            <span v-for="(type, index) in typeList" :key="index" @click="goPath(type)">{{
              type.name
            }}</span>
          </div>
        </div>

        <div class="user">
          <div class="head-avatar-box" v-if="isLogin">
            <div class="head-avatar" @click="showExit()">
              <img :src="userInfo?.info?.avatar" alt="" />
            </div>

            <div class="user-card" v-if="isShowExit">
              <div class="us-top-box">
                <div class="uc-top" @click="toUserHome()">
                  <img class="uc-avatar" :src="userInfo?.info?.avatar" alt="" />
                  <div class="uc-meta">
                    <div class="uc-name">{{ userInfo?.info?.nickname || "" }}</div>
                    <div class="uc-id">ID: {{ userInfo?.info?.id || "" }}</div>
                  </div>
                </div>
                <div class="uc-stats">
                  <div class="uc-stat" @click="toMyFollowsSubs()">
                    <div class="uc-stat-num">{{ subscribeCount }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.subscribeLabel") }}</div>
                  </div>
                  <div class="uc-stat" @click="toUserHomeTab(3)">
                    <div class="uc-stat-num">{{ followersCountDisplay }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.followersLabel") }}</div>
                  </div>
                  <div class="uc-stat" @click="toUserHomeTab(1)">
                    <div class="uc-stat-num">{{ postCount }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.postLabel") }}</div>
                  </div>
                </div>
              </div>

              <div class="uc-menu">
                <div
                  class="uc-item"
                  v-for="item in menuItems"
                  :key="item.key"
                  @click="navigateMenu(item)"
                >
                  <span>{{ t(item.label) }}</span>
                  <img src="../assets/images/header/arrow.png" alt="" />
                </div>
                <div class="uc-item logout" @click="logout()">
                  <span>{{ t("header.menu.logout") }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="user-btn" v-else>
            <span class="user-login" @click="goLogin()">{{ t("header.login") }}</span>
            <span class="user-register" @click="goRegister()">{{ t("header.register") }}</span>
          </div>
        </div>
      </div>
    </div>

    <UploadMask v-if="isShowLoad" :visible="isShowLoad" :text="t('loading')" />

    <Agree ref="agreeRef" @toRegister="toRegister"></Agree>
    <AICreationsModal
      v-if="isShowAICreationsModal"
      :visible="isShowAICreationsModal"
      :creations="aiCreations"
      @close="closeAICreationsModal"
    />

    <LogoutModal
      :visible="isShowLogoutModal"
      @close="cancelLogout"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup lang="ts" name="AppHeader">
import Agree from "@/components/Agree.vue";
import AICreationsModal from "@/components/AICreationsModal.vue";
import UploadMask from "@/components/UploadMask.vue";
import LogoutModal from "@/components/LogoutModal.vue";

import { onBeforeUnmount, onMounted, ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import api from "@/api/index";
import router from "@/router";

const emit = defineEmits(['userInfoLoaded', 'messageInfoLoaded', 'messageInfoUpdated']);
const route = useRoute();

type ApiResp<T> = { code: number; msg: string; msg_jp: string; data: T };

const { t, locale } = useI18n();

const agreeRef = ref<InstanceType<typeof Agree> | null>(null);
const isLogin = ref(false);
const isShowLogoutModal = ref(false);

const navIndex = ref(0);
const provider = ref(null);
const subscribeCount = ref(0);
const followersCount = ref(0);
const postCount = ref(0);
const followersCountDisplay = computed(() => {
  const v = followersCount.value;
  if (v >= 1000) {
    const k = Math.round(v / 1000);
    return `${k}K`;
  }
  return `${v}`;
});
const isShowLoad = ref(false);
const isShowContribution = ref(false);
const isShowExit = ref(false);
const isShowNewsMenu = ref(false);
const unTotal = ref(0);
const newsCounts = ref({
  expiring: 0,
  follow: 0,
  subscription: 0,
  like: 0,
  comment: 0,
  mention: 0,
});

const newsMenuList = computed(() => [
  { label: "user.messages.tab1", count: newsCounts.value.expiring, tab: 0 },
  { label: "user.messages.tab2", count: newsCounts.value.follow, tab: 1 },
  { label: "user.messages.tab3", count: newsCounts.value.subscription, tab: 2 },
  { label: "user.messages.tab4", count: newsCounts.value.like, tab: 3 },
  { label: "user.messages.tab5", count: newsCounts.value.comment, tab: 4 },
  { label: "user.messages.tab6", count: newsCounts.value.mention, tab: 5 },
]);

const menuItems = [
  { key: "personal", label: "user.sidebar.personalInfo", path: "/user-personal" },
  { key: "account", label: "user.sidebar.account", path: "/user-account" },
  { key: "profile", label: "user.sidebar.profile", path: "/user-profile" },
  { key: "subscription", label: "user.sidebar.subscription", path: "/user-subscription" },
  { key: "revenue", label: "user.sidebar.revenue", path: "/user-revenue" },
  { key: "myfollows-subs", label: "user.myFollowsSubs.title", path: "/user-my-follows-subs" },
  { key: "interactive", label: "user.sidebar.interactive", path: "/user-interactive" },
  { key: "messages", label: "user.sidebar.messages", path: "/user-message" },
  { key: "privacy", label: "user.sidebar.privacy", path: "/user-privacy" },
  { key: "payment-history", label: "user.paymentHistory.title", path: "/user-payment-history" },
];

const langList = ref(["EN", "JP", "ZH"]);
const lang = localStorage.getItem("lang");
const langText = ref(lang);
const isShowLang = ref(false);
const userInfo = ref();

const bean = ref(0);

// AI Creations Modal
const isShowAICreationsModal = ref(false);
const aiCreations = ref<any[]>([]);

const navList = ref([
  {
    name: t("header.title1"),
    path: "/",
  },
  // {
  //   name: t("header.title2"),
  //   path: "",
  // },
  {
    name: t("header.title3"),
    path: "/my-projects",
  },
  {
    name: t("header.title4"),
    path: "/character-library",
  },
]);

const typeList = ref([
  {
    name: t("header.type1"),
    path: "/ai",
  },
  {
    name: t("header.type2"),
    path: "/publish/video",
  },
  // {
  //   name: t("header.type3"),
  //   path: "/publish/image",
  // },
  // {
  //   name: t("header.type4"),
  //   path: "/publish/article",
  // },
]);

const props = defineProps<{
  cur: number;
}>();

watch(locale, () => {
  navList.value = [
    {
      name: t("header.title1"),
      path: "/",
    },
    // {
    //   name: t("header.title2"),
    //   path: "",
    // },
    {
      name: t("header.title3"),
      path: "/my-projects",
    },
    {
      name: t("header.title4"),
      path: "/character-library",
    },
  ];

  typeList.value = [
    {
      name: t("header.type1"),
      path: "/ai",
    },
    {
      name: t("header.type2"),
      path: "/publish/video",
    },
    // {
    //   name: t("header.type3"),
    //   path: "/publish/image",
    // },
    // {
    //   name: t("header.type4"),
    //   path: "/publish/article",
    // },
  ];
});

onMounted(() => {
  const token = localStorage.getItem("token");
  navIndex.value = props.cur;

  if (token) {
    isLogin.value = true;
    getUserInfo();
    getMessageInfo();
  }

  document.addEventListener("click", handleClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClick);
});

const handleClick = (event: MouseEvent) => {
  const headUser = document.querySelector(".head-avatar-box");
  const headContribution = document.querySelector(".header-contribution");
  const headNews = document.querySelector(".header-news-box");
  const languageDropdown = document.querySelector(".language");

  if (headUser && !headUser.contains(event.target as Node)) {
    isShowExit.value = false;
  }

  if (headContribution && !headContribution.contains(event.target as Node)) {
    isShowContribution.value = false;
  }

  if (headNews && !headNews.contains(event.target as Node)) {
    isShowNewsMenu.value = false;
  }

  if (languageDropdown && !languageDropdown.contains(event.target as Node)) {
    isShowLang.value = false;
  }
};

function goHome() {
  router.push('/');
}

function goNav(item: { path: string; name?: string }, index: number) {
  const token = localStorage.getItem("token");

  if (item.path == "") {
    return false;
  }

  if (item.path == "/create" || item.path == "/my-projects") {
    if (!token) {
      router.push("/login");
    } else {
      navIndex.value = index;
      router.push(item.path);
    }
    return false;
  }

  navIndex.value = index;
  router.push(item.path);
}

function goPath(type: { path: string; name: string }) {
  if (type.name === t('header.type1')) {
    fetchAICreations();
  } else {
    router.replace(type.path);
  }
}

async function fetchAICreations() {
  isShowLoad.value = true;
  try {
    const res = await api.getProject(2, 1, 'story', 1, 20) as any;

    if (res.code === 0 || res.code === 200) {
      const data = res.data?.data_list || [];

      aiCreations.value = data.map((item: any) => ({
        id: item.id,
        type: item.type === '1' ? 'video' : 'image',
        title: item.title,
        thumbnail: item.cover || item.image,
        videoUrl: item.video_url,
        createdAt: item.created_at
      }));

      if (aiCreations.value.length === 0) {
        toast(t('header.aiTip'));
      } else {
        isShowAICreationsModal.value = true;
      }
    } else {
      toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
    }
  } catch (error) {
    toast(t('fail'));
  } finally {
    isShowLoad.value = false;
  }
}

function closeAICreationsModal() {
  isShowAICreationsModal.value = false;
}

function showNewsMenu() {
  isShowNewsMenu.value = !isShowNewsMenu.value;
}

function goNews(item?: { tab: number }) {
  isShowNewsMenu.value = false;
  router.replace({
    path: "/user-message",
    query: item ? { tab: item.tab } : {},
  });
}

function showLang() {
  isShowLang.value = !isShowLang.value;
}

function changeLang(item: string) {
  const lang = item.toLocaleLowerCase();

  if (lang == langText.value) {
    return false;
  }

  isShowLang.value = false;
  langText.value = lang;
  localStorage.setItem("lang", lang);
  locale.value = lang;
}

function getMessageInfo() {
  api
    .messageInfo()
    .then((res) => {
      const data = res as any;
      if (data.code === 0) {
        unTotal.value = data.data.total;

        newsCounts.value = {
          expiring: data.data.subscribe_expire,
          follow: data.data.follow,
          subscription: data.data.subscribe_me,
          like: data.data.like,
          comment: data.data.comment,
          mention: data.data.mention,
        };
        // Emit message info to parent components
        emit('messageInfoLoaded', newsCounts.value);
      } else {
        toast(locale.value == 'jp' ? data.msg_jp : data.msg);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Handle message info updated from child components
function handleMessageInfoUpdated(updatedCounts: typeof newsCounts.value) {
  newsCounts.value = updatedCounts;
  // Recalculate total unread count
  unTotal.value = Object.values(updatedCounts).reduce((total, count) => total + count, 0);
  // Emit updated message info to parent components
  emit('messageInfoUpdated', updatedCounts);
}

function getUserInfo() {
  api
    .userInfo()
    .then((res) => {
      const data = res as any;
      if (data.code === 0) {
        userInfo.value = data.data;
        subscribeCount.value = data.data.sub_count;
        followersCount.value = data.data.fans_count;
        postCount.value = data.data.product_count;
        emit('userInfoLoaded', data.data);
      } else {
        toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function getLoginUserInfo() {
  api
    .userInfo()
    .then((res) => {
      const data = res as any;
      if (data.code === 0) {
        userInfo.value = res.data;

        localStorage.setItem('uid', data.data.info.id)
      } else {
        toast(locale.value == 'jp' ?  data.msg_jp : data.msg)
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function toRegister() {
  router.push({
    path: "/register",
  });
}

function goLogin() {
  router.push({
    path: "/login",
  });
}

function goRegister() {
  if (agreeRef.value) {
    agreeRef.value.showAgree();
  }
}

function showContribution() {
  isShowContribution.value = !isShowContribution.value;
}

function showExit() {
  isShowExit.value = !isShowExit.value;
}

function toUserHome() {
  isShowExit.value = false;
  router.push({
    path: "/user-home",
    query: {
      id: userInfo.value.info.id,
    },
  });
}

function toUserHomeTab(tab: number) {
  const userId = userInfo.value.info.id;

  if (isShowExit.value) {
    isShowExit.value = false;
  }

  router.replace({
    path: "/user-home",
    query: {
      id: userId,
      type: tab
    },
  });
}

function toMyFollowsSubs() {
  router.push({
    path: "/user-my-follows-subs"
  });
}

function navigateMenu(item: { path: string }) {
  isShowExit.value = false;
  router.push(item.path);
}

function logout() {
  if (isShowExit.value) {
    isShowExit.value = false;
  }
  isShowLogoutModal.value = true;
}

function confirmLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("connect");
  localStorage.removeItem("uid");

  provider.value = null;
  isShowExit.value = false;
  isLogin.value = false;
  isShowLogoutModal.value = false;

  const currentPath = window.location.pathname;
  const keepPaths = ["/detail", "/user-home", "character-library", "search"];
  const shouldKeepPath = keepPaths.some(path => currentPath.includes(path));

  if (!shouldKeepPath) {
    router.push("/");
  }
}

function cancelLogout() {
  isShowLogoutModal.value = false;
}

function goRecharge() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-recharge');
}

// 暴露给父组件的方法
defineExpose({
  getUserInfo,
  getLoginUserInfo,
  getMessageInfo,
  logout,
  goRegister
});
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 10rem;
  padding: 2rem 0 0;
  z-index: 310;

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 139.2rem;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 0 2rem 0 3rem;
    border: 1px solid #fccee8;
    -webkit-border-radius: 1.2rem;
    border-radius: 1.2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(3px);

    .left {
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .logo {
        display: flex;
        width: 8rem;
        height: 2.4rem;
        margin: 0 3rem 0 0;
        cursor: pointer;

        img {
          width: auto;
          height: 2.4rem;
        }
      }

      .nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.8rem;

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          height: 5rem;
          padding: 0 1rem;
          font-size: 1.6rem;
          -webkit-border-radius: 1.2rem;
          border-radius: 1.2rem;
          color: #6a7282;
          cursor: pointer;

          &:hover {
            background: rgba(251, 100, 182, 0.06);
            color: #fb64b6;
          }

          &.on {
            border: 1px solid #fb64b6;
            background: rgba(251, 100, 182, 0.12);
            color: #fb64b6;
          }
        }
      }
    }

    .right {
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .language {
        position: relative;
        display: flex;

        .language-icon {
          width: 4rem;
          height: 4rem;
          background: url("@/assets/images/header/language_icon.png") no-repeat;
          background-size: 100% 100%;
          cursor: pointer;

          &:hover {
            background: url("@/assets/images/header/language_hover.png") no-repeat;
            background-size: 100% 100%;
          }
        }

        .language-select {
          position: absolute;
          left: 0;
          top: 5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 8rem;
          padding: 1.2rem 0;
          border: 1px solid rgba(251, 100, 182, 0.2);
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          background: rgba(255, 255, 255, 0.9);

          span {
            width: 100%;
            margin-bottom: 1.4rem;
            font-size: 1.4rem;
            text-align: center;
            color: #6a7282;
            cursor: pointer;

            &:last-child {
              margin-bottom: 0;
            }

            &:hover,
            &.on {
              font: {
                weight: 500;
              }
              color: #101828;
            }
          }
        }
      }

      .header-news-box {
          position: relative;
          display: flex;
          align-items: center;
          margin: 0 1rem 0 0;

          .header-news {
            position: relative;
            display: flex;
            align-items: center;
            cursor: pointer;

            .news-icon {
              width: 3.2rem;
              height: 3.2rem;
              background: url("@/assets/images/header/news_icon.png") no-repeat;
              background-size: 100% 100%;

              &:hover {
                background: url("@/assets/images/header/news_hover.png") no-repeat;
                background-size: 100% 100%;
              }
            }

            .circle {
              position: absolute;
              top: 0;
              right: -0.2rem;
              width: 0.8rem;
              height: 0.8rem;
              border-radius: 50%;
              background: #ff3a3a;
            }
          }

          .news-dropdown {
            position: absolute;
            left: 0;
            top: 4.6rem;
            min-width: 17rem;
            max-width: 30rem;
            width: max-content;
            background: rgba(255,255,255,0.9);
            border: 1px solid rgba(251, 100, 182, 0.2);
            border-radius: 0.8rem;
            padding: 0.6rem 1.2rem;
            z-index: 10;

            .news-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1.2rem;
              padding: 0.8rem 0;
              font-size: 1.4rem;
              color: #6A7282;
              cursor: pointer;
              white-space: nowrap;

              span{
                flex-shrink: 0;
              }

              .count-dot {
                min-width: 1.6rem;
                height: 1.6rem;
                padding: 0 0.6rem;
                background: #FA2D47;
                color: #ffffff;
                border-radius: 0.8rem;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
              }
            }
          }
        }

      .header-bean-box {
        display: flex;
        align-items: center;
        margin: 0 1rem;
        border: 1px solid rgba(251, 100, 182, 0.5);
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;

        .header-bean {
          display: flex;
          align-items: center;
          height: 4rem;
          padding: 0.6rem;
          cursor: pointer;

          &:hover {
            -webkit-border-radius: 0.6rem 0 0 0.6rem;
            border-radius: 0.6rem 0 0 0.6rem;
            background: rgba(251, 100, 182, 0.06);
          }

          img {
            width: 2.8rem;
            height: 2.8rem;
            margin-right: 0.9rem;
          }

          span {
            font-size: 1.4rem;
            color: #101828;
          }
        }

        .header-line {
          width: 1px;
          height: 1rem;
          background: rgba(251, 100, 182, 0.2);
        }

        .header-recharge {
          display: flex;
          align-items: center;
          height: 4rem;
          padding: 0 0.6rem;
          font-size: 1.2rem;
          color: #fb64b6;
          cursor: pointer;

          &:hover {
            -webkit-border-radius: 0 0.6rem 0.6rem 0;
            border-radius: 0 0.6rem 0.6rem 0;
            background: rgba(251, 100, 182, 0.06);
          }
        }
      }

      .header-contribution-box {
        position: relative;
        .header-contribution {
          min-width: 9.8rem;
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          background: linear-gradient(45deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
          color: #ffffff;
          cursor: pointer;

          &:hover {
            &::after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(255, 255, 255, 0.2);
            }
          }
        }

        .header-contribution-info {
          position: absolute;
          left: 0;
          top: 5rem;
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 1.2rem 0;
          font-size: 1.4rem;
          border: 1px solid rgba(251, 100, 182, 0.2);
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.9);
          color: #6a7282;

          span {
            width: 100%;
            margin: 0 0 1.2rem;
            cursor: pointer;

            &:last-child {
              margin: 0;
            }

            &:hover {
              color: #101828;
            }
          }
        }
      }

      .user {
        position: relative;
        margin: 0 0 0 1rem;

        .user-btn {
          display: flex;
          align-items: center;
          .user-login {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            min-width: 9.8rem;
            height: 4rem;
            margin: 0 1rem 0 0;
            font: {
              size: 1.4rem;
            }
            border: 1px solid #fb64b6;
            -webkit-border-radius: 0.8rem;
            border-radius: 0.8rem;
            color: #fb64b6;
            cursor: pointer;

            &:hover {
              background: rgba(251, 100, 182, 0.06);
            }
          }

          .user-register {
            position: relative;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            min-width: 9.8rem;
            height: 4rem;
            font: {
              size: 1.4rem;
            }
            -webkit-border-radius: 0.8rem;
            border-radius: 0.8rem;
            background: linear-gradient(45deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
            color: #ffffff;
            cursor: pointer;
          }
        }

        .head-avatar-box {
          position: relative;
          .head-avatar {
            width: 100%;
            height: 100%;
            display: flex;

            img {
              width: 4rem;
              height: 4rem;
              border: 1px solid #fb64b6;
              -webkit-border-radius: 0.8rem;
              border-radius: 0.8rem;
              object-fit: cover;
              cursor: pointer;
            }
          }

          .user-card {
            position: absolute;
            right: 0;
            top: 5rem;
            width: 28rem;
            border: 1px solid rgba(251, 100, 182, 0.2);
            -webkit-border-radius: 0.8rem;
            border-radius: 0.8rem;
            background: rgba(255, 255, 255, 1);
            z-index: 1;

            .us-top-box {
              padding: 1.2rem;
              border-bottom: 1px solid rgba(251, 100, 182, 0.06);
              cursor: pointer;

              .uc-top {
                display: flex;
                align-items: center;

                .uc-avatar {
                  width: 4.8rem;
                  height: 4.8rem;
                  border: 1px solid #fb64b6;
                  -webkit-border-radius: 0.8rem;
                  border-radius: 0.8rem;
                  margin-right: 1.2rem;
                }

                .uc-meta {
                  display: flex;
                  flex-direction: column;

                  .uc-name {
                    font-size: 1.4rem;
                    color: #101828;
                  }

                  .uc-id {
                    margin-top: 0.4rem;
                    font-size: 1.2rem;
                    color: #99a1af;
                  }
                }
              }
              .uc-stats {
                display: flex;
                justify-content: space-between;
                margin-top: 1.2rem;

                .uc-stat {
                  display: flex;
                  flex-direction: column;
                  align-items: center;

                  .uc-stat-num {
                    font-size: 1.6rem;
                    color: #101828;
                  }

                  .uc-stat-label {
                    margin-top: 0.4rem;
                    font-size: 1.2rem;
                    color: #99a1af;
                  }
                }
              }
            }

            .uc-menu {
              display: flex;
              flex-direction: column;

              .uc-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 4rem;
                padding: 0 1.6rem;
                font-size: 1.4rem;
                color: #364153;
                cursor: pointer;

                &:hover {
                  background: rgba(251, 100, 182, 0.06);
                }

                &.logout {
                  border-top: 1px solid rgba(251, 100, 182, 0.06);
                  color: #99a1af;
                }

                img {
                  width: 1.6rem;
                  height: 1.6rem;
                }
              }
            }
          }
        }

        .address-hide {
          position: absolute;
          bottom: -3.6rem;
          left: 50%;
          display: flex;
          display: -webkit-flex;
          flex-wrap: wrap;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);
          font: {
            weight: 500;
            size: 2rem;
          }
          text-transform: uppercase;
          color: #1f1f21;
          img {
            width: 2.6rem;
            height: 1.8rem;
          }

          .logout {
            cursor: pointer;
          }
        }
      }
    }
  }

  .load {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    z-index: 800;
    img {
      width: 3.2rem;
      height: 3.2rem;
      animation: rotate 2s linear infinite;
    }
    p {
      margin: 2rem 0 0;
      font: {
        size: 1.8rem;
        weight: 500;
      }
      color: #ffffff;
    }
  }
}
</style>
