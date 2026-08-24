import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import Login from "@/views/login/Login.vue";
import Register from "@/views/login/Register.vue";
import ResetSend from "@/views/login/ResetSend.vue";
import ResetPassword from "@/views/login/ResetPassword.vue";
import i18n from "@/lang/i18n";

const LANG_URL_TO_I18N: Record<string, string> = {
  ja: 'jp',
  en: 'en',
  'zh-cn': 'zh',
  'zh-tw': 'tc',
};

const LANG_URL_TO_HTML: Record<string, string> = {
  ja: 'ja',
  en: 'en',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
};

const CONTENT_TYPES = ['novel', 'comic', 'drama', 'photo', 'video'];

// SEO 预渲染会生成 `dist/{lang}/{type}/index.html` 静态文件。
// 通过 alias 让 `/zh-cn/novel/index.html` 这类直接打开的地址也能命中同一路由，
// 保持规范 URL 不变（不做重定向），避免被 catch-all 重定向回首页。
const langHomeRoutes = Object.entries(LANG_URL_TO_I18N).map(([urlPrefix, i18nKey]) => ({
  path: `/${urlPrefix}`,
  alias: `/${urlPrefix}/index.html`,
  name: `Home_${i18nKey}`,
  component: Home,
  meta: { lang: i18nKey },
}));

const langContentTypeRoutes = Object.entries(LANG_URL_TO_I18N).flatMap(([urlPrefix, i18nKey]) =>
  CONTENT_TYPES.map(type => ({
    path: `/${urlPrefix}/${type}`,
    alias: `/${urlPrefix}/${type}/index.html`,
    name: `Home_${i18nKey}_${type}`,
    component: Home,
    meta: { lang: i18nKey, contentType: type },
  }))
);

const contentTypeRoutes = CONTENT_TYPES.map(type => ({
  path: `/${type}`,
  alias: `/${type}/index.html`,
  name: `Home_${type}`,
  component: Home,
  meta: { contentType: type },
}));

const routes = [
  ...langHomeRoutes,
  ...langContentTypeRoutes,
  ...contentTypeRoutes,
  {
    path: "/",
    alias: "/index.html",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: "/reset-send",
    name: "ResetSend",
    component: ResetSend,
  },
  // {
  //   path: "/privacy",
  //   name: "Privacy",
  //   component: Privacy,
  // },
  // {
  //   path: "/terms",
  //   name: "Terms",
  //   component: Terms,
  // },
  // {
  //   path: "/payment-terms",
  //   name: "PaymentTerms",
  //   component: PaymentTerms,
  // },
  {
    path: "/ai-recharge",
    name: "AIRecharge",
    component: () => import("@/views/AIRecharge.vue"),
  },
  {
    path: "/ai-points-details",
    name: "AIRechargeDetails",
    component: () => import("@/views/AIRechargeDetails.vue"),
  },
  {
    path: "/computing-rules",
    name: "ComputingPowerRules",
    component: () => import("@/views/ComputingPowerRules.vue"),
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: "/publish/video",
    name: "PublishVideo",
    component: () => import("@/views/publish/Video.vue"),
  },
  {
    path: "/publish/comic",
    name: "PublishComic",
    component: () => import("@/views/publish/Comic.vue"),
  },
  {
    path: "/publish/novel",
    name: "PublishNovel",
    component: () => import("@/views/publish/Novel.vue"),
  },
  {
    path: "/publish/success",
    name: "PublishSuccess",
    component: () => import("@/views/publish/Success.vue"),
  },
  {
    path: "/publish/image",
    name: "PublishImage",
    component: () => import("@/views/publish/PublishImage.vue"),
  },
  {
    path: "/publish/generate-video",
    name: "PublishGenerateVideo",
    component: () => import("@/views/publish/PublishGenerateVideo.vue"),
  },
  {
    path: "/detail",
    name: "Detail",
    component: () => import("@/views/Detail.vue"),
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("@/views/Search.vue"),
  },
  {
    path: "/similar",
    name: "Similar",
    component: () => import("@/views/Similar.vue"),
  },
  {
    path: "/my-projects",
    name: "MyProjects",
    component: () => import("@/views/MyProjects.vue"),
  },
  {
    path: "/character-library",
    name: "CharacterLibrary",
    component: () => import("@/views/CharacterLibrary.vue"),
  },
  {
    path: "/generate",
    name: "Generate",
    component: () => import("@/views/Generate.vue"),
  },
  {
    path: "/novel/:id",
    name: "NovelGenerate",
    component: () => import("@/views/NovelGenerate.vue"),
  },
  {
    path: "/user-home",
    name: "UserHome",
    component: () => import("@/views/user/UserHome.vue"),
  },
  {
    path: "/subscription-payment",
    name: "SubscriptionPayment",
    component: () => import("@/views/user/SubscriptionPayment.vue"),
  },
  {
    path: "/subscription-success",
    name: "SubscriptionSuccess",
    component: () => import("@/views/user/SubscriptionSuccess.vue"),
  },
  {
    path: "/subscription-fail",
    name: "SubscriptionFailed",
    component: () => import("@/views/user/SubscriptionFailed.vue"),
  },
  {
    path: "/aitool-payment-success",
    name: "AIToolPaymentSuccess",
    component: () => import("@/views/user/AIToolPaymentSuccess.vue"),
  },
  {
    path: "/token-withdraw-success",
    name: "TokenWithdrawSuccess",
    component: () => import("@/views/user/TokenWithdrawSuccess.vue"),
  },
  {
    path: "/aitool-payment-fail",
    name: "AIToolPaymentFailed",
    component: () => import("@/views/user/AIToolPaymentFailed.vue"),
  },
  {
    path: "/user-personal",
    name: "UserPersonalInfo",
    component: () => import("@/views/user/Personal.vue"),
  },
  {
    path: "/user-personal-edit",
    name: "UserPersonalEdit",
    component: () => import("@/views/user/PersonalEdit.vue"),
  },
  {
    path: "/user-interactive",
    name: "UserInteractive",
    component: () => import("@/views/user/Interactive.vue"),
  },
  {
    path: "/user-invite",
    name: "InviteRevenue",
    component: () => import("@/views/user/InviteRevenue.vue"),
  },
  {
    path: "/user-revenue",
    name: "UserRevenue",
    component: () => import("@/views/user/Revenue.vue"),
  },
  // {
  //   path: "/community-convention",
  //   name: "CommunityConvention",
  //   component: () => import("@/views/user/CommunityConvention.vue"),
  // },
  {
    path: "/user-subscription",
    name: "UserSubscription",
    component: () => import("@/views/user/Subscription.vue"),
  },
  {
    path: "/user-kyc",
    name: "UserKyc",
    component: () => import("@/views/user/KycVerify.vue"),
  },
  {
    path: "/user-subscription-edit",
    name: "UserSubscriptionEdit",
    component: () => import("@/views/user/SubscriptionEdit.vue"),
  },
  {
    path: "/account-success",
    name: "AccountSuccess",
    component: () => import("@/views/user/AccountSuccess.vue"),
  },
  {
    path: "/account-fail",
    name: "AccountFailed",
    component: () => import("@/views/user/AccountFailed.vue"),
  },
  {
    path: "/user-privacy",
    name: "UserPrivacy",
    component: () => import("@/views/user/Privacy.vue"),
  },
  {
    path: "/user-message",
    name: "UserMessages",
    component: () => import("@/views/user/Messages.vue"),
  },
  {
    path: "/user-account",
    name: "UserAccount",
    component: () => import("@/views/user/Account.vue"),
  },
  {
    path: "/user-profile",
    name: "UserProfileSettings",
    component: () => import("@/views/user/Profile.vue"),
  },
  {
    path: "/user-profile-edit",
    name: "UserProfileEdit",
    component: () => import("@/views/user/ProfileEdit.vue"),
  },
  {
    path: "/user-payment-history",
    name: "PaymentHistory",
    component: () => import("@/views/user/PaymentHistory.vue"),
  },
  {
    path: "/collection/:id",
    name: "CollectionDetail",
    component: () => import("@/views/CollectionDetail.vue"),
  },
  {
    path: "/collection-settings/:id",
    name: "CollectionSettings",
    component: () => import("@/views/CollectionSettings.vue"),
  },
  {
    path: "/create-collection",
    name: "CreateCollection",
    component: () => import("@/views/CreateCollection.vue"),
  },
  {
    path: "/rank",
    name: "Ranking",
    component: () => import("@/views/Ranking.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果是导航到首页，滚动到顶部
    if (to.name === 'Home') {
      return { top: 0, behavior: 'auto' };
    }
    // 如果有保存的滚动位置，恢复它
    if (savedPosition) {
      return savedPosition;
    }
    // 默认滚动到顶部
    return { top: 0, behavior: 'auto' };
  },
});

// Subdomain routing logic
router.beforeEach((to, from, next) => {
  const langFromMeta = to.meta.lang as string | undefined;
  if (langFromMeta) {
    i18n.global.locale.value = langFromMeta;
    document.documentElement.lang = LANG_URL_TO_HTML[Object.entries(LANG_URL_TO_I18N).find(([, v]) => v === langFromMeta)?.[0] || 'ja'] || 'ja';
    localStorage.setItem('lang', langFromMeta);
  }

  const contentTypeFromMeta = to.meta.contentType as string | undefined;
  if (contentTypeFromMeta) {
    to.meta.contentType = contentTypeFromMeta;
  }

  const host = window.location.hostname;
  const subdomain = host.split('.')[0];

  const subdomainMap: Record<string, string> = {
    'novel': 'novel',
    'comic': 'comic',
    'drama': 'drama',
    'photo': 'photo',
    'video': 'video'
  };

  if (subdomainMap[subdomain]) {
    to.meta.contentType = subdomainMap[subdomain];
  }

  next();
});

export default router;
