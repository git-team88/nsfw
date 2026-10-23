import { createRouter, createWebHistory, type RouteLocation } from "vue-router";
import { trackPageView } from "@/utils/track";
import { applyRouteTitle, refreshRouteTexts } from "@/utils/pageTitle";
import Home from "@/views/Home.vue";
import Login from "@/views/login/Login.vue";
import Register from "@/views/login/Register.vue";
import ResetSend from "@/views/login/ResetSend.vue";
import ResetPassword from "@/views/login/ResetPassword.vue";
import i18n, { setLocale, loadLocaleMessages, isLocaleLoaded } from "@/lang/i18n";

const LANG_URL_TO_I18N: Record<string, string> = {
  ja: 'jp',
  en: 'en',
  'zh-cn': 'zh',
  'zh-tw': 'tc',
  ko: 'ko',
  th: 'th',
};

const LANG_URL_TO_HTML: Record<string, string> = {
  ja: 'ja',
  en: 'en',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
  ko: 'ko',
  th: 'th',
};

const CONTENT_TYPES = ['novel', 'comic', 'photo', 'video'];

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
    meta: { titleKey: "pageTitle.resetSend" },
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
    meta: { titleKey: "pageTitle.recharge" },
    component: () => import("@/views/AIRecharge.vue"),
  },
  {
    path: "/ai-points-details",
    name: "AIRechargeDetails",
    meta: { titleKey: "pageTitle.rechargeDetails" },
    component: () => import("@/views/AIRechargeDetails.vue"),
  },
  {
    path: "/computing-rules",
    name: "ComputingPowerRules",
    meta: { titleKey: "pageTitle.computingRules" },
    component: () => import("@/views/ComputingPowerRules.vue"),
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    meta: { titleKey: "pageTitle.resetPassword" },
    component: ResetPassword,
  },
  {
    path: "/publish/video",
    name: "PublishVideo",
    meta: { titleKey: "pageTitle.publishVideo" },
    component: () => import("@/views/publish/Video.vue"),
  },
  {
    // 漫剧本地批量上传：页面上不放入口，直接用链接打开
    path: "/publish/video-batch",
    name: "PublishVideoBatch",
    meta: { titleKey: "pageTitle.publishVideoBatch" },
    component: () => import("@/views/publish/VideoBatch.vue"),
  },
  {
    // 短剧本地批量上传页（没有入口，靠链接打开）
    path: "/publish/clip-batch",
    name: "PublishClipBatch",
    meta: { titleKey: "pageTitle.publishClipBatch" },
    component: () => import("@/views/publish/ClipBatch.vue"),
  },
  {
    path: "/publish/comic",
    name: "PublishComic",
    meta: { titleKey: "pageTitle.publishComic" },
    component: () => import("@/views/publish/Comic.vue"),
  },
  {
    path: "/publish/novel",
    name: "PublishNovel",
    meta: { titleKey: "pageTitle.publishNovel" },
    component: () => import("@/views/publish/Novel.vue"),
  },
  {
    path: "/publish/success",
    name: "PublishSuccess",
    meta: { titleKey: "pageTitle.publishSuccess" },
    component: () => import("@/views/publish/Success.vue"),
  },
  {
    path: "/publish/image",
    name: "PublishImage",
    meta: { titleKey: "pageTitle.publishImage" },
    component: () => import("@/views/publish/Image.vue"),
  },
  {
    path: "/publish/clip",
    name: "PublishClip",
    meta: { titleKey: "pageTitle.publishClip" },
    component: () => import("@/views/publish/Clip.vue"),
  },
  {
    path: "/detail/:id",
    name: "Detail",
    component: () => import("@/views/Detail.vue"),
  },
  {
    // 旧地址 /detail?id=x 兼容：后端推送、m 站、已分享出去的链接还是这种形式，
    // 转成 /detail/x，其余 query（tab/type/cid/rid…）原样带过去
    path: "/detail",
    redirect: (to: RouteLocation) => {
      const { id, ...rest } = to.query;
      return id ? { path: `/detail/${id}`, query: rest } : { path: "/" };
    },
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("@/views/Search.vue"),
  },
  {
    path: "/similar",
    name: "Similar",
    meta: { titleKey: "pageTitle.similar" },
    component: () => import("@/views/Similar.vue"),
  },
  {
    path: "/my-projects",
    name: "MyProjects",
    meta: { titleKey: "pageTitle.myProjects" },
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
    path: "/user-home/:id",
    name: "UserHome",
    component: () => import("@/views/user/UserHome.vue"),
  },
  {
    // 旧地址 /user-home?id=x 兼容：转成 /user-home/x，其余 query（type/tab/fav）原样带过去；
    // 没带 id 的（如未登录点「个人中心」）用本地 uid，再没有就回首页
    path: "/user-home",
    redirect: (to: RouteLocation) => {
      const { id, ...rest } = to.query;
      const uid = id || localStorage.getItem("uid") || "";
      return uid ? { path: `/user-home/${uid}`, query: rest } : { path: "/" };
    },
  },
  {
    path: "/subscription-payment",
    name: "SubscriptionPayment",
    meta: { titleKey: "pageTitle.subscriptionPayment" },
    component: () => import("@/views/user/SubscriptionPayment.vue"),
  },
  {
    path: "/subscription-success",
    name: "SubscriptionSuccess",
    meta: { titleKey: "pageTitle.paySuccess" },
    component: () => import("@/views/user/SubscriptionSuccess.vue"),
  },
  {
    path: "/subscription-fail",
    name: "SubscriptionFailed",
    meta: { titleKey: "pageTitle.payFailed" },
    component: () => import("@/views/user/SubscriptionFailed.vue"),
  },
  {
    // 漫剧解锁的支付结果页。带 post_id，成功页的「观看作品」按它回详情
    path: "/drama-unlock-success",
    name: "DramaUnlockSuccess",
    meta: { titleKey: "pageTitle.paySuccess" },
    component: () => import("@/views/user/DramaUnlockSuccess.vue"),
  },
  {
    path: "/drama-unlock-fail",
    name: "DramaUnlockFailed",
    meta: { titleKey: "pageTitle.payFailed" },
    component: () => import("@/views/user/DramaUnlockFailed.vue"),
  },
  {
    path: "/aitool-payment-success",
    name: "AIToolPaymentSuccess",
    meta: { titleKey: "pageTitle.paySuccess" },
    component: () => import("@/views/user/AIToolPaymentSuccess.vue"),
  },
  {
    path: "/token-withdraw-success",
    name: "TokenWithdrawSuccess",
    meta: { titleKey: "pageTitle.withdrawSuccess" },
    component: () => import("@/views/user/TokenWithdrawSuccess.vue"),
  },
  {
    path: "/aitool-payment-fail",
    name: "AIToolPaymentFailed",
    meta: { titleKey: "pageTitle.payFailed" },
    component: () => import("@/views/user/AIToolPaymentFailed.vue"),
  },
  {
    path: "/user-personal",
    name: "UserPersonalInfo",
    meta: { titleKey: "pageTitle.personal" },
    component: () => import("@/views/user/Personal.vue"),
  },
  {
    path: "/user-personal-edit",
    name: "UserPersonalEdit",
    meta: { titleKey: "pageTitle.personalEdit" },
    component: () => import("@/views/user/PersonalEdit.vue"),
  },
  {
    path: "/user-interactive",
    name: "UserInteractive",
    meta: { titleKey: "pageTitle.interactive" },
    component: () => import("@/views/user/Interactive.vue"),
  },
  {
    path: "/user-invite",
    name: "InviteRevenue",
    meta: { titleKey: "pageTitle.invite" },
    component: () => import("@/views/user/InviteRevenue.vue"),
  },
  {
    path: "/user-revenue",
    name: "UserRevenue",
    meta: { titleKey: "pageTitle.revenue" },
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
    meta: { titleKey: "pageTitle.subscription" },
    component: () => import("@/views/user/Subscription.vue"),
  },
  {
    path: "/user-kyc",
    name: "UserKyc",
    meta: { titleKey: "pageTitle.kyc" },
    component: () => import("@/views/user/KycVerify.vue"),
  },
  {
    path: "/user-subscription-edit",
    name: "UserSubscriptionEdit",
    meta: { titleKey: "pageTitle.subscriptionEdit" },
    component: () => import("@/views/user/SubscriptionEdit.vue"),
  },
  {
    path: "/account-success",
    name: "AccountSuccess",
    meta: { titleKey: "pageTitle.accountSuccess" },
    component: () => import("@/views/user/AccountSuccess.vue"),
  },
  {
    path: "/account-fail",
    name: "AccountFailed",
    meta: { titleKey: "pageTitle.accountFailed" },
    component: () => import("@/views/user/AccountFailed.vue"),
  },
  {
    path: "/user-privacy",
    name: "UserPrivacy",
    meta: { titleKey: "pageTitle.privacy" },
    component: () => import("@/views/user/Privacy.vue"),
  },
  {
    path: "/user-message",
    name: "UserMessages",
    meta: { titleKey: "pageTitle.messages" },
    component: () => import("@/views/user/Messages.vue"),
  },
  {
    path: "/user-account",
    name: "UserAccount",
    meta: { titleKey: "pageTitle.account" },
    component: () => import("@/views/user/Account.vue"),
  },
  {
    path: "/user-profile",
    name: "UserProfileSettings",
    meta: { titleKey: "pageTitle.profile" },
    component: () => import("@/views/user/Profile.vue"),
  },
  {
    path: "/user-profile-edit",
    name: "UserProfileEdit",
    meta: { titleKey: "pageTitle.profileEdit" },
    component: () => import("@/views/user/ProfileEdit.vue"),
  },
  {
    path: "/user-payment-history",
    name: "PaymentHistory",
    meta: { titleKey: "pageTitle.paymentHistory" },
    component: () => import("@/views/user/PaymentHistory.vue"),
  },
  {
    path: "/collection/:id",
    name: "CollectionDetail",
    // 标题由页面按合集数据自己拼（UGC 规则），不配固定的 titleKey，免得先闪一下「合集 - 站点名」
    component: () => import("@/views/CollectionDetail.vue"),
  },
  {
    path: "/collection-settings/:id",
    name: "CollectionSettings",
    meta: { titleKey: "pageTitle.collectionSettings" },
    component: () => import("@/views/CollectionSettings.vue"),
  },
  {
    path: "/create-collection",
    name: "CreateCollection",
    meta: { titleKey: "pageTitle.createCollection" },
    component: () => import("@/views/CreateCollection.vue"),
  },
  // 排行榜入口暂时隐藏，需要放出时把这段注释解开。
  // 路由摘掉后 /rank 会落到下面的兜底规则，直接回首页。
  // {
  //   path: "/rank",
  //   name: "Ranking",
  //   component: () => import("@/views/Ranking.vue"),
  // },
  {
    // 未知路径 → 404 页（不再重定向回首页）。
    // 之前 redirect:"/" 会让任何乱路径都「200 + 首页内容」，形成无限重复内容（soft 404）；
    // 配合 seo-server 对 NotFound 的 seo-status 标记返回真实 404 状态码。
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.name === 'Home') {
      return { top: 0, behavior: 'auto' };
    }
    if (savedPosition) {
      return savedPosition;
    }
    const homeNames = new Set([
      'Home', ...Object.values(LANG_URL_TO_I18N).map(l => `Home_${l}`),
      ...CONTENT_TYPES.map(t => `Home_${t}`),
      ...Object.entries(LANG_URL_TO_I18N).flatMap(([, l]) => CONTENT_TYPES.map(t => `Home_${l}_${t}`)),
    ]);
    if (homeNames.has(String(from.name)) && homeNames.has(String(to.name))) {
      return false;
    }
    return { top: 0, behavior: 'auto' };
  },
});

// Subdomain routing logic
router.beforeEach(async (to, from, next) => {
  const langFromMeta = to.meta.lang as string | undefined;
  if (langFromMeta) {
    await setLocale(langFromMeta);
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
    'photo': 'photo',
    'video': 'video'
  };

  if (subdomainMap[subdomain]) {
    to.meta.contentType = subdomainMap[subdomain];
  }

  next();
});

// 埋点：每次路由切换报一条 page_view（带页面名 / 作品 / 合集 / 博主 id）
router.afterEach((to, from) => {
  // 浏览器标签标题：配了 meta.titleKey 的路由统一设成「页面名 - 站点名」
  applyRouteTitle(to, from);
  // 首次打开时语言包可能还没装好（标题会是 key）：装好后再补一次文案
  const lang = String(i18n.global.locale.value || '');
  if (!isLocaleLoaded(lang)) {
    loadLocaleMessages(lang).then(() => {
      if (router.currentRoute.value.fullPath == to.fullPath) refreshRouteTexts(to);
    }).catch(() => {});
  }
  trackPageView({ path: to.path, name: to.name ? String(to.name) : "", params: to.params as any, query: to.query as any });
});

export default router;
