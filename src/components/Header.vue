<template>
  <div class="header">
    <div class="container">
      <div class="left">
        <div class="logo" @click="goHome">
          <img src="@/assets/images/header/logo.png" />
        </div>

        <div class="nav">
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
            <img class="news-icon" src="@/assets/images/header/news_icon.png" alt="" />
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
          <img class="language-icon" src="@/assets/images/header/language_icon.png" @click="showLang" />

          <div class="language-select" v-if="isShowLang">
            <span
              :class="langText == lang.value ? 'on' : ''"
              v-for="(lang, index) in langList"
              :key="index"
              @click="changeLang(lang.value)"
              >{{ lang.label }}</span
            >
          </div>
        </div>

        <div class="header-bean-box" v-if="isLogin">
          <div class="header-bean" @click="goRechargeDetail">
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
              <img :src="userInfo?.info?.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
            </div>

            <div class="user-card" v-if="isShowExit">
              <div class="us-top-box">
                <div class="uc-top" @click="toUserHome()">
                  <img class="uc-avatar" :src="userInfo?.info?.avatar || defaultAvatar" alt="" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
                  <div class="uc-meta">
                    <div class="uc-name">{{ userInfo?.info?.nickname || "" }}</div>
                    <!-- <div class="uc-id">ID: {{ userInfo?.info?.id || "" }}</div> -->
                  </div>
                </div>
                <div class="uc-stats">
                  <div class="uc-stat" @click="goPaymentHistory()">
                    <div class="uc-stat-num">{{ subscribeCount }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.subscribeLabel") }}</div>
                  </div>
                  <div class="uc-stat" @click="toUserHomeTab(2)">
                    <div class="uc-stat-num">{{ followersCountDisplay }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.followersLabel") }}</div>
                  </div>
                  <div class="uc-stat" @click="toUserHomeTab(3)">
                    <div class="uc-stat-num">{{ fansCountDisplay }}</div>
                    <div class="uc-stat-label">{{ t("header.userCard.fansLabel") }}</div>
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
                  <span class="uc-item-icon" v-html="getMenuIcon(item.key)"></span>
                  <span>{{ t(item.label) }}</span>
                </div>
              </div>
              <div class="uc-logout-section">
                <div class="uc-item uc-item-logout" @click="logout()">
                  <span class="uc-item-icon" v-html="logoutIcon"></span>
                  <span>{{ t("header.menu.logout") }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="user-btn" v-else>
            <button class="user-login" @click="goLogin()">{{ t("header.login") }}</button>
            <button class="user-register" @click="goRegister()">
              {{ t("header.register") }}
              <div class="register-tip" style="display:none">
                <div class="tip-gift-icon">
                  <img src="@/assets/images/header/gift.png" alt="" />
                </div>

                <div class="tip-content">
                  <div class="register-tip-top">
                    <span class="tip-new-user">{{ t("header.registerTip.newUser") }}</span>
                    <span class="tip-arrow-badge">
                      <img src="@/assets/images/header/icon.png" alt="" />
                    </span>
                  </div>
                  <div class="register-tip-bottom">
                    <img class="tip-benefit-icon" src="@/assets/images/header/tip.png" alt="" />
                    <span>{{ t("header.registerTip.benefit") }}</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <UploadMask v-if="isShowLoad" :visible="isShowLoad" :text="t('loading')" />

    <Agree ref="agreeRef" @toRegister="toRegister"></Agree>

    <LogoutModal
      :visible="isShowLogoutModal"
      @close="cancelLogout"
      @confirm="confirmLogout"
    />
  </div>
</template>

<script setup lang="ts" name="AppHeader">
import Agree from "@/components/Agree.vue";
import UploadMask from "@/components/UploadMask.vue";
import LogoutModal from "@/components/LogoutModal.vue";
import defaultAvatar from "@/assets/images/base/avatar.png";

import { onBeforeUnmount, onMounted, ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { toast } from "@/util/toast";
import api from "@/api/index";
import router from "@/router";
import { eventBus } from "@/utils/eventBus";
import { setUserId, clearUserId } from "@/utils/analytics";

const emit = defineEmits(['userInfoLoaded', 'messageInfoLoaded', 'messageInfoUpdated', 'balanceInfoLoaded']);
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
const fansCount = ref(0);
const postCount = ref(0);
const followersCountDisplay = computed(() => {
  const v = followersCount.value;
  if (v >= 1000) {
    const k = Math.round(v / 1000);
    return `${k}K`;
  }
  return `${v}`;
});
const fansCountDisplay = computed(() => {
  const v = fansCount.value;
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
  { key: "invite", label: "user.sidebar.inviteRevenue", path: "/user-invite" },
  { key: "revenue", label: "user.sidebar.revenue", path: "/user-revenue" },
  { key: "interactive", label: "user.sidebar.interactive", path: "/user-interactive" },
  { key: "messages", label: "user.sidebar.messages", path: "/user-message" },
  { key: "privacy", label: "user.sidebar.privacy", path: "/user-privacy" },
  { key: "payment-history", label: "user.paymentHistory.title", path: "/user-payment-history" },
];

const langList = [
  { value: 'jp', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'tc', label: '中文繁體' },
  { value: 'zh', label: '中文简体' }
];
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
  {
    name: t("header.title5"),
    path: "/user-home",
  },
]);

const typeList = ref([
  // {
  //   name: t("header.type1"),
  //   path: "/ai",
  // },
  {
    name: t("header.type4"),
    path: "/publish/novel",
  },
  {
    name: t("header.type3"),
    path: "/publish/comic",
  },
  {
    name: t("header.type2"),
    path: "/publish/video",
  },
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
    {
      name: t("header.title5"),
      path: "/user-home",
    },
  ];

  typeList.value = [
    // {
    //   name: t("header.type1"),
    //   path: "/ai",
    // },
    {
      name: t("header.type4"),
      path: "/publish/novel",
    },
    {
      name: t("header.type3"),
      path: "/publish/comic",
    },
    {
      name: t("header.type2"),
      path: "/publish/video",
    },
  ];
});

const handleLogout = () => {
  isLogin.value = false;
  userInfo.value = null;
};

onMounted(() => {
  const token = localStorage.getItem("token");
  navIndex.value = props.cur;

  if (token) {
    isLogin.value = true;
    getUserInfo();
    getMessageInfo();
    getBalance();
  }

  document.addEventListener("click", handleClick);
  window.addEventListener('userLogout', handleLogout);

  eventBus.on('balanceUpdated', getBalance);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClick);
  window.removeEventListener('userLogout', handleLogout);
  eventBus.off('balanceUpdated', getBalance);
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

  if (item.path == "/user-home") {
    if (!token) {
      router.push("/login");
      return false;
    }
    const userId = userInfo.value?.info?.id || localStorage.getItem("uid");
    navIndex.value = index;
    router.push({
      path: "/user-home",
      query: { id: userId }
    });
    return false;
  }

  navIndex.value = index;
  router.push(item.path);
}

function goPath(type: { path: string; name: string }) {
  router.push(type.path);
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

function changeLang(lang: string) {
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
        toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function getUserInfo() {
  api
    .userInfo()
    .then((res) => {
      const data = res as any;
      if (data.code === 0) {
        userInfo.value = data.data;
        subscribeCount.value = data.data.sub_count;
        followersCount.value = data.data.follow_count;
        fansCount.value = data.data.fans_count;
        postCount.value = data.data.book_count;
        emit('userInfoLoaded', data.data);
        setUserId(String(data.data.info.id));
      } else {
        toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp)
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function getBalance() {
  api.userBalance().then((res: any) => {
    if (res.code === 200) {
      // Use total_balance if available, fallback to balance
      bean.value = res.data.balance;

      emit('balanceInfoLoaded', res.data);
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
    }
  })
  .catch((err) => {
    toast(t('fail'));
  });
}

function getLoginUserInfo() {
  api
    .userInfo()
    .then((res) => {
      const data = res as any;
      if (data.code === 0) {
        userInfo.value = data.data;

        localStorage.setItem('uid', data.data.info.id);
        setUserId(String(data.data.info.id));
      } else {
        toast(locale.value == 'en' ? data.msg : locale.value == 'zh' ? data.msg_cn : locale.value == 'tc' ? data.msg_tc : data.msg_jp);
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
      tab: tab
    },
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
  localStorage.removeItem("allowSensitiveContent");

  clearUserId();
  provider.value = null;
  isShowExit.value = false;
  isLogin.value = false;
  isShowLogoutModal.value = false;

  eventBus.emit('userLoggedOut');

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

function goRechargeDetail() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-points-details');
}

function goRecharge() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');
    return false;
  }

  router.push('/ai-recharge');
}

function goPaymentHistory() {
  router.push('/user-payment-history');
}

const svgShell = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">';

function getMenuIcon(key: string): string {
  const icons: Record<string, string> = {
    personal: svgShell + '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    account: svgShell + '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="2"/></svg>',
    profile: svgShell + '<path d="M5 18h14"/><path d="M5 18 4 9l4.5 3.4L12 6l3.5 6.4L20 9l-1 9Z"/></svg>',
    subscription: svgShell + '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>',
    invite: svgShell + '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8"/><path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/></svg>',
    revenue: svgShell + '<path d="M4 20h16"/><rect x="6" y="13" width="3" height="7" rx=".5"/><rect x="11" y="9" width="3" height="11" rx=".5"/><rect x="16" y="5" width="3" height="15" rx=".5"/></svg>',
    interactive: svgShell + '<path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg>',
    messages: svgShell + '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    privacy: svgShell + '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    'payment-history': svgShell + '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
  };
  return icons[key] || svgShell + '<circle cx="12" cy="12" r="10"/></svg>';
}

const logoutIcon = svgShell + '<path d="M12 3v8"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/></svg>';

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
  z-index: 310;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 11px 28px;
  border-bottom: 3px solid #161122;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(14px);

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 1160px;
    margin: 0 auto;

    .left {
      display: flex;
      align-items: center;

      .logo {
        display: flex;
        align-items: center;
        margin: 0 12px 0 0;
        cursor: pointer;

        img {
          width: auto;
          height: 46px;
        }
      }

      .nav {
        display: flex;
        align-items: center;
        gap: 6px;

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          height: 44px;
          padding: 0 15px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 14px;
          color: #161122;
          opacity: 0.6;
          cursor: pointer;
          transition: opacity 0.15s, background 0.15s;

          &:hover {
            opacity: 1;
            background: rgba(255,77,142,0.06);
          }

          &.on {
            background: #FF4D8E;
            color: #ffffff;
            opacity: 1;
          }
        }
      }
    }

    .right {
      display: flex;
      align-items: center;
      gap: 14px;

      .language {
        position: relative;
        display: flex;

        .language-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 2px solid #161122;
          display: grid;
          place-items: center;
          cursor: pointer;
          background: #fff;
          transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
          box-shadow: 2px 2px 0 #161122;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 3px 3px 0 #161122;
          }

          img {
            width: 23px;
            height: 23px;
          }
        }

        .language-select {
          position: absolute;
          left: 50%;
          top: 62px;
          display: flex;
          flex-direction: column;
          min-width: 230px;
          padding: 8px;
          border: 3px solid #161122;
          border-radius: 18px;
          background: #FFFDF7;
          border: 3px solid #161122;
          box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
          box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
          transform: translateX(-50%);
          z-index: 330;
          overflow: hidden;

          span {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 11px 12px;
            font-size: 14px;
            font-weight: 800;
            color: #161122;
            cursor: pointer;
            border-radius: 11px;
            text-align: left;
            transition: background 0.15s;

            .lang-check {
              width: 18px;
              text-align: center;
              color: #FF4D8D;
            }

            &:hover,
            &.on {
              background: #FFEFF5;
            }
          }
        }
      }

      .header-news-box {
        position: relative;
        display: flex;
        align-items: center;

        .header-news {
          position: relative;
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 2px solid #161122;
          cursor: pointer;
          background: #fff;
          box-shadow: 2px 2px 0 #161122;
          transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 3px 3px 0 #161122;
          }

          .news-icon {
            width: 23px;
            height: 23px;
          }

          .circle {
            position: absolute;
            top: -5px;
            right: -5px;
            min-width: 21px;
            height: 21px;
            padding: 0 5px;
            border-radius: 50%;
            background: #FF4D8D;
            border: 2px solid #fff;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            display: grid;
            place-items: center;
          }
        }

        .news-dropdown {
          position: absolute;
          left: 0;
          top: 56px;
          min-width: 170px;
          max-width: 300px;
          width: max-content;
          border: 3px solid #161122;
          border-radius: 18px;
          padding: 8px;
          background: #FFFDF7;
          border: 3px solid #161122;
          box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
          box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
          z-index: 10;
          overflow: hidden;

          .news-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 12px;
            font-size: 14px;
            font-weight: 700;
            color: #161122;
            opacity: 0.65;
            cursor: pointer;
            white-space: nowrap;
            border-radius: 11px;
            transition: background 0.15s, opacity 0.15s;

            &:hover {
              opacity: 1;
              background: #FFEFF5;
            }

            span {
              flex-shrink: 0;
            }

            .count-dot {
              min-width: 16px;
              height: 16px;
              padding: 0 6px;
              background: #FF4D8D;
              color: #ffffff;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 800;
              display: grid;
              place-items: center;
            }
          }
        }
      }

      .header-bean-box {
        display: flex;
        align-items: center;
        height: 50px;
        padding: 0 18px;
        border-radius: 14px;
        border: 2px solid #161122;
        background: #161122;
        color: #fff;
        cursor: pointer;
        box-shadow: 2px 2px 0 #161122;
        transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 3px 3px 0 #161122;
        }

        .header-bean {
          display: flex;
          align-items: center;
          cursor: pointer;

          img {
            width: 24px;
            height: 24px;
            margin-right: 6px;
          }

          span {
            font-size: 14px;
            font-weight: 800;
            color: #FFD23F;
          }
        }

        .header-line {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.3);
          margin: 0 12px;
        }

        .header-recharge {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;

          &:hover {
            color: #fff;
          }
        }

        .bean-symbol {
          font-size: 19px;
          color: #FFD23F;
          line-height: 1;
        }

        .bean-count {
          font-size: 17px;
          font-weight: 800;
        }

        .bean-label {
          font-size: 13px;
          font-weight: 700;
          opacity: 0.7;
          margin-left: 4px;
        }
      }

      .header-contribution-box {
        position: relative;
        .header-contribution {
          min-width: 98px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          border-radius: 14px;
          border: 2px solid #161122;
          background: linear-gradient(135deg, #FF4D8D, #FF7A45);
          color: #ffffff;
          cursor: pointer;
          box-shadow: 2px 2px 0 #161122;
          transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 3px 3px 0 #161122;
          }
        }

        .header-contribution-info {
          position: absolute;
          left: 0;
          top: 56px;
          display: flex;
          flex-direction: column;
          width: 100%;
          border: 3px solid #161122;
          border-radius: 18px;
          padding: 8px;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          background: #FFFFFF;
          box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
          color: #161122;
          overflow: hidden;

          span {
            width: 100%;
            padding: 11px 12px;
            margin: 0;
            cursor: pointer;
            opacity: 0.65;
            border-radius: 11px;
            transition: background 0.15s, opacity 0.15s;

            &:hover {
              opacity: 1;
              background: #FFEFF5;
            }
          }
        }
      }

      .user {
        position: relative;

        .user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          .user-login {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 46px;
            padding: 0 16px;
            font-size: 14px;
            font-weight: 800;
            border-radius: 13px;
            border: 2px solid #161122;
            background: #FFFDF7;
            border: 3px solid #161122;
            box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
            color: #161122;
            cursor: pointer;
            box-shadow: 2px 2px 0 #161122;
            transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 3px 3px 0 #161122;
              color: #FF4D8D;
            }
          }

          .user-register {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 46px;
            padding: 0 16px;
            font-size: 14px;
            font-weight: 800;
            border-radius: 13px;
            border: 2px solid #161122;
            background: linear-gradient(135deg, #FF4D8D, #FF7A45);
            color: #ffffff;
            cursor: pointer;
            box-shadow: 2px 2px 0 #161122;
            transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 3px 3px 0 #161122;
            }

            .register-tip {
              position: absolute;
              right: 50%;
              transform: translateX(31%);
              top: -2px;
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 338px;
              min-height: 140px;
              padding: 58px 48px 48px;
              pointer-events: none;
              background-image: url('@/assets/images/register/tip_bg.png');
              background-size: 100% 100%;
              background-repeat: no-repeat;
              background-position: center;

              .tip-gift-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                background: #FF4D8D;
                border-radius: 16px;

                img {
                  width: 16px;
                  height: 16px;
                }
              }

              .tip-content {
                flex: 1;
                flex-shrink: 0;
              }

              .register-tip-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;

                .tip-new-user {
                  font-size: 14px;
                  color: #161122;
                  font-weight: 800;
                }

                .tip-arrow-badge {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 32px;
                  height: 18px;
                  background: #FFFDF7;
                  border: 3px solid #161122;
                  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
                  border-radius: 12px;

                  img {
                    width: 12px;
                    height: 12px;
                  }
                }
              }

              .register-tip-bottom {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-top: 6px;

                .tip-benefit-icon {
                  width: 12px;
                  height: 12px;
                }

                span {
                  font-weight: 800;
                  font-size: 12px;
                  color: #FF4D8D;
                }
              }
            }
          }
        }

        .head-avatar-box {
          position: relative;
          .head-avatar {
            width: 100%;
            height: 100%;
            display: flex;

            img {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              border: 2.5px solid #161122;
              object-fit: cover;
              cursor: pointer;
              box-shadow: 2px 2px 0 #161122;
            }
          }

          .user-card {
            position: absolute;
            right: 0;
            top: 56px;
            width: 308px;
            border: 3px solid #161122;
            border-radius: 20px;
            background: #FFFDF7;
            border: 3px solid #161122;
            box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
            box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
            z-index: 1;
            overflow: hidden;
            transform-origin: top right;
            animation: avmPanelIn 180ms cubic-bezier(0.16, 1, 0.3, 1) both;

            @keyframes avmPanelIn {
              0% { opacity: 0; transform: scale(.92) translateY(-6px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }

            .us-top-box {
              padding: 18px 18px 14px;
              cursor: pointer;

              .uc-top {
                display: flex;
                align-items: center;
                gap: 13px;

                .uc-avatar {
                  width: 56px;
                  height: 56px;
                  border-radius: 50%;
                  border: 2.5px solid #161122;
                  object-fit: cover;
                  flex-shrink: 0;
                }

                .uc-meta {
                  display: flex;
                  flex-direction: column;
                  min-width: 0;

                  .uc-name {
                    font-size: 17px;
                    font-weight: 800;
                    color: #161122;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }

                  .uc-id {
                    margin-top: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #161122;
                    opacity: 0.5;
                  }
                }
              }
              .uc-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                border: 2px solid #161122;
                border-radius: 13px;
                overflow: hidden;
                margin-top: 14px;

                .uc-stat {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 9px 4px;
                  border-right: 1px solid rgba(22,17,34,.12);

                  &:last-child {
                    border-right: none;
                  }

                  .uc-stat-num {
                    font-size: 16px;
                    font-weight: 800;
                    color: #161122;
                  }

                  .uc-stat-label {
                    margin-top: 2px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #161122;
                    opacity: 0.55;
                  }
                }
              }
            }

            .uc-menu {
              display: flex;
              flex-direction: column;
              padding: 6px 8px 8px;
              border-top: 1px solid rgba(22,17,34,.1);

              .uc-item {
                display: flex;
                align-items: center;
                gap: 11px;
                padding: 9px 11px;
                font-size: 13.5px;
                font-weight: 700;
                color: #161122;
                border-radius: 11px;
                cursor: pointer;
                transition: background 0.15s ease-out, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease-out;
                width: 100%;
                text-align: left;

                &:hover {
                  background: #F3EFE7;
                  transform: translateX(3px);
                }

                &:hover .uc-item-icon {
                  color: #FF4D8D;
                }

                .uc-item-icon {
                  width: 20px;
                  height: 20px;
                  display: grid;
                  place-items: center;
                  flex-shrink: 0;
                  color: #161122;
                  transition: color 0.15s ease-out;
                }
              }
            }

            .uc-logout-section {
              padding: 8px;
              border-top: 1px solid rgba(22,17,34,.1);

              .uc-item-logout {
                display: flex;
                align-items: center;
                gap: 11px;
                padding: 9px 11px;
                font-size: 13.5px;
                font-weight: 700;
                color: #E5484D;
                border-radius: 11px;
                cursor: pointer;
                transition: background 0.15s ease-out, transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);

                &:hover {
                  background: rgba(229, 72, 77, 0.08);
                  transform: translateX(3px);
                }

                .uc-item-icon {
                  width: 20px;
                  height: 20px;
                  display: grid;
                  place-items: center;
                  flex-shrink: 0;
                  color: #E5484D;
                }
              }
            }
          }
        }

        .address-hide {
          position: absolute;
          bottom: -36px;
          left: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);
          font-size: 20px;
          font-weight: 600;
          text-transform: uppercase;
          color: #161122;
          img {
            width: 26px;
            height: 18px;
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    z-index: 800;
    img {
      width: 32px;
      height: 32px;
      animation: rotate 2s linear infinite;
    }
    p {
      margin: 20px 0 0;
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
    }
  }
}

@media (max-width: 1080px) {
  .header {
    .container {
      .left {
        .nav {
          display: none;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .header {
    padding: 11px 16px;
    gap: 8px;

    .container {
      .left {
        .logo {
          img {
            height: 36px;
          }
        }
      }

      .right {
        gap: 8px;

        .header-bean-box {
          display: none;
        }

        .language .language-icon {
          width: 40px;
          height: 40px;
        }

        .header-news-box .header-news {
          width: 40px;
          height: 40px;
        }

        .user .user-btn {
          .user-login,
          .user-register {
            height: 40px;
            padding: 0 12px;
            font-size: 13px;
          }
        }

        .user .head-avatar-box .head-avatar img {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .header {
    padding: 8px 12px;
    gap: 6px;

    .container {
      .right {
        gap: 6px;

        .header-contribution-box {
          display: none;
        }

        .language .language-icon {
          width: 36px;
          height: 36px;
        }

        .header-news-box .header-news {
          width: 36px;
          height: 36px;
        }

        .user .user-btn {
          .user-login,
          .user-register {
            height: 36px;
            padding: 0 10px;
            font-size: 12px;
          }
        }

        .user .head-avatar-box .head-avatar img {
          width: 36px;
          height: 36px;
        }
      }
    }
  }
}
</style>
