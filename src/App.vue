<template>
  <!-- 作品详情上 / 下一个：新旧两个页面同时在屏上，旧的滑出、新的滑进（pageSlideDir 为空时没有过渡） -->
  <RouterView v-slot="{ Component }">
    <Transition :name="pageSlideDir ? 'page-slide-' + pageSlideDir : 'page-none'" :css="!!pageSlideDir" @after-leave="pageSlideDir = ''">
      <component :is="Component" :key="routeViewKey" />
    </Transition>
  </RouterView>
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import { useRoute, useRouter } from 'vue-router';
import { pageSlideDir } from '@/util/pageSlide';

const contentSwitch = useContentSwitchStore();
const { locale } = useI18n();

const route = useRoute();
const router = useRouter();

// 首页各内容类型路由（/、/{lang}、/{lang}/{type}、/{type}）共用同一 key，
// 使切换内容类型 tab 时不触发 Home 组件重挂载（避免重新请求首页所有接口）；
// 个人主页同理，key 只跟用户 id 走，切子 tab（type / tab 变化）不重挂载，
// 换一个用户（id 变化）才重挂载；其它页面仍按 fullPath 作为 key。
const routeViewKey = computed(() => {
  const path = route.fullPath;
  const pathOnly = route.path;
  const LANGS = 'ja|en|zh-cn|zh-tw|ko|th';
  const TYPES = 'novel|comic|drama|photo|video';
  const isHome =
    pathOnly === '/' ||
    new RegExp(`^/(${LANGS})(/(${TYPES}))?/?$`).test(pathOnly) ||
    new RegExp(`^/(${TYPES})/?$`).test(pathOnly);
  // 个人主页：只认用户 id，query 里的 type / tab 不参与
  if (pathOnly.startsWith('/user-home/')) {
    return `user-home:${route.params.id ?? ''}`;
  }

  // 我的项目：数据只跟当前登录用户走，query 里就一个 tab，用固定 key
  if (pathOnly === '/my-projects') {
    return 'my-projects';
  }

  return isHome ? 'home' : path;
});

const languageFontMap: Record<string, string> = {
  'en': 'en',
  'jp': 'ja',
  'zh': 'cn',
  'tc': 'tc',
  // 韩、泰没有专门的字体类，走英文那套系统字体（日文字体栈里没有韩文/泰文字形）
  'ko': 'en',
  'th': 'en'
};

const htmlLangMap: Record<string, string> = {
  'jp': 'ja',
  'en': 'en',
  'zh': 'zh-CN',
  'tc': 'zh-TW',
  'ko': 'ko',
  'th': 'th'
};

// 站点地址（canonical 用）始终用当前实际访问地址（含协议/端口/域名）；
// 移动端域名仍按正式/测试区分：正式站(*.fansfans.ai)→ m.fansfans.ai，其它 → mtest.fansfans.ai。
function resolveOrigins() {
  const host = window.location.hostname;
  const isProd = !host.startsWith('wwwtest') && host.endsWith('fansfans.ai');
  return {
    site: window.location.origin,
    mobile: isProd ? 'https://m.fansfans.ai' : 'https://mtest.fansfans.ai',
  };
}

function updateBodyFontClass() {
  const lang = locale.value;
  const fontClass = languageFontMap[lang] || 'en';

  document.body.classList.remove('en', 'ja', 'cn', 'tc');
  document.body.classList.add(fontClass);
}

function updateHtmlLang() {
  document.documentElement.lang = htmlLangMap[locale.value] || 'en';
}

function updateHreflang() {
  // 不再输出 hreflang：清除任何已有的 hreflang 链接（含 index.html 里可能残留的写死项）
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
}

// 根据当前路由计算「PC 自指 canonical」与「对应的移动端 alternate」URL。
// canonical：所有页面都自指当前页。
// mobile（移动端 alternate）：仅以下 4 类页面输出，其余页面为 null（不加 alternate）：
//   首页/语言页/分类页  → m 站首页
//   合集详情  /collection/:id            → /detail/book-public/:id
//   作品详情  /detail/x?tab=2             → /detail/novel/x
//   社区主页  /user-home/x               → /user/x
// 内容类型 → m 站详情页目录名；key 同时收数字（tab）和英文名（contentType）
const MOBILE_TYPE_DIR: Record<string, string> = {
  '1': 'comic', '2': 'novel', '3': 'drama', '4': 'image', '5': 'video',
  comic: 'comic', novel: 'novel', drama: 'drama', image: 'image', photo: 'image', video: 'video',
};
function computeSeoUrls(): { canonical: string; mobile: string | null } {
  const { site: SITE_ORIGIN, mobile: MOBILE_ORIGIN } = resolveOrigins();
  const path = route.path;
  const q = route.query;

  const col = path.match(/^\/collection\/([^/?#]+)/);
  if (col) {
    const id = col[1];
    return {
      canonical: `${SITE_ORIGIN}/collection/${id}`,
      mobile: `${MOBILE_ORIGIN}/detail/book-public/${id}`,
    };
  }

  const uh = path.match(/^\/user-home\/([^/?#]+)/);
  if (uh) {
    return {
      canonical: `${SITE_ORIGIN}/user-home/${uh[1]}`,
      mobile: `${MOBILE_ORIGIN}/user/${uh[1]}`,
    };
  }

  const det = path.match(/^\/detail\/([^/?#]+)/);
  if (det) {
    const id = det[1];
    const t = q.contentType ? String(q.contentType) : '';
    // m 站作品详情是 /detail/{类型}/{id}（comic/novel/drama/image/video）。
    // PC 地址栏里类型在 tab（数字 1-5）或 contentType（英文名）里，映射成 m 站的目录名；
    // 两个都没有时不知道类型，不输出移动端 alternate，免得指到一个不存在的地址
    const typeDir = MOBILE_TYPE_DIR[String(q.tab ?? t)] || '';
    return {
      canonical: `${SITE_ORIGIN}/detail/${id}${t ? `?contentType=${t}` : ''}`,
      mobile: typeDir ? `${MOBILE_ORIGIN}/detail/${typeDir}/${id}` : null,
    };
  }

  // 首页 / 语言页 / 分类页（Home 组件）：canonical 自指当前页；移动端 alternate 指向 m 站首页。
  // 用路径判断而非 route.name（初始加载 / SEO 渲染时 route.name 可能尚未就绪）。
  //   / | /{lang} | /{lang}/{type} | /{type}
  const cleanPath = path === '/' ? '/' : path;
  const LANGS = 'ja|en|zh-cn|zh-tw|ko|th';
  const TYPES = 'novel|comic|drama|photo|video';
  const isHome =
    path === '/' ||
    new RegExp(`^/(${LANGS})(/(${TYPES}))?/?$`).test(path) ||
    new RegExp(`^/(${TYPES})/?$`).test(path);
  return {
    canonical: `${SITE_ORIGIN}${cleanPath}`,
    mobile: isHome ? `${MOBILE_ORIGIN}/` : null,
  };
}

// A/C：所有页面写 PC 自指 canonical；仅 4 类页面写移动端 alternate。
// 原地复用已有 <link>，值没变化就不动（避免切换内容类型 tab 时无谓地删除重建）。
function updateAltAndCanonical() {
  const { canonical, mobile } = computeSeoUrls();

  // 移动端 alternate
  let alt = document.head.querySelector<HTMLLinkElement>('link[rel="alternate"][media]');
  if (mobile) {
    if (!alt) {
      alt = document.createElement('link');
      alt.rel = 'alternate';
      alt.media = 'only screen and (max-width: 640px)';
      alt.setAttribute('data-alt-mobile', '');
      document.head.appendChild(alt);
    }
    if (alt.href !== mobile) alt.href = mobile;
  } else if (alt) {
    alt.remove();
  }

  // canonical（所有页面都有）
  let can = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!can) {
    can = document.createElement('link');
    can.rel = 'canonical';
    can.setAttribute('data-canonical', '');
    document.head.appendChild(can);
  }
  if (can.href !== canonical) can.href = canonical;
}

onMounted(() => {
  void contentSwitch.ensureLoaded();
  updateBodyFontClass();
  updateHtmlLang();
  updateHreflang();
  updateAltAndCanonical();

  window.addEventListener('storage', (e) => {
    if (e.key == 'lang') {
      const newLang = e.newValue || 'en';
      if (newLang !== locale.value) {
        locale.value = newLang;
      }
      updateBodyFontClass();
      updateHtmlLang();
    }
  });

  watch(() => route.path, () => {
    updateBodyFontClass();
    updateHreflang();
  });

  // canonical/alternate 依赖 query（如 /detail/x?contentType=t），用 fullPath 监听
  watch(() => route.fullPath, () => {
    updateAltAndCanonical();
  });
});

watch(locale, () => {
  updateBodyFontClass();
  updateHtmlLang();
});
</script>

<style lang="scss">
/* 作品详情上 / 下一个的整页滑动：过渡期间新旧两页都铺满视口叠在一起，各自往自己的方向滑 */
.page-slide-up-enter-active,
.page-slide-up-leave-active,
.page-slide-down-enter-active,
.page-slide-down-leave-active {
  position: fixed;
  inset: 0;
  will-change: transform;
  transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}
/* 去下一个：旧页往上出，新页从下进 */
.page-slide-up-enter-from { transform: translateY(100%); }
.page-slide-up-leave-to { transform: translateY(-100%); }
/* 回上一个：旧页往下出，新页从上进 */
.page-slide-down-enter-from { transform: translateY(-100%); }
.page-slide-down-leave-to { transform: translateY(100%); }
</style>
