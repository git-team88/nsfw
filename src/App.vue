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
import { setLocale } from '@/lang/i18n';
import { useContentSwitchStore } from '@/stores/contentSwitch';
import { useRoute, useRouter } from 'vue-router';
import { pageSlideDir } from '@/util/pageSlide';
import { initTracking } from '@/utils/track';
import { applyRouteTitle } from '@/utils/pageTitle';

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

// 站点地址（canonical 用）始终用当前实际访问地址（含协议/端口/域名）
function resolveOrigins() {
  return { site: window.location.origin };
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

// —— hreflang / og:locale ——
// hreflang 只给「有独立语言 URL 变体」的页面输出：
//   /                    → 6 个 /{lang} + x-default=/
//   /{lang}              → 同上（base 为空）
//   /{lang}/{type}、/{type} → 6 个 /{lang}/{type} + x-default=/{type}
// 其余路由（详情页/条款页等）是「单 URL 多语言」（语言由 localStorage/浏览器决定），
// 不存在「每个语言一个 URL」的对应关系，输出 hreflang 反而制造错误信号，因此不输出。
// ⚠️ 刻意不在 index.html 里写静态 hreflang：index.html 是所有路由共用的壳，
//    写死的 hreflang 对非首页路由全是错的（这正是历史上把它删掉的原因）。
//    爬虫走 seo-server 渲染，App.vue 运行时注入的 hreflang 会出现在渲染结果里。
const LANG_URLS = ['ja', 'en', 'zh-cn', 'zh-tw', 'ko', 'th'];
const HREFLANG_MAP: Record<string, string> = {
  ja: 'ja', en: 'en', 'zh-cn': 'zh-Hans', 'zh-tw': 'zh-Hant', ko: 'ko', th: 'th',
};
const OG_LOCALE_MAP: Record<string, string> = {
  jp: 'ja_JP', en: 'en_US', zh: 'zh_CN', tc: 'zh_TW', ko: 'ko_KR', th: 'th_TH',
};
const OG_LOCALE_ALL = ['ja_JP', 'en_US', 'zh_CN', 'zh_TW', 'ko_KR', 'th_TH'];

function updateHreflang() {
  // 先清掉旧值（含路由切换残留），再按当前路由决定是否注入
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

  const path = route.path;
  const LANGS = 'ja|en|zh-cn|zh-tw|ko|th';
  const TYPES = 'novel|comic|drama|photo|video';
  let base: string | null = null;
  if (path === '/') {
    base = '';
  } else {
    const langMatch = path.match(new RegExp(`^/(${LANGS})(/(${TYPES}))?/?$`));
    if (langMatch) {
      base = langMatch[2] || '';
    } else {
      const typeMatch = path.match(new RegExp(`^/(${TYPES})/?$`));
      if (typeMatch) base = `/${typeMatch[1]}`;
    }
  }
  if (base === null) return; // 非首页族路由：没有语言 URL 变体，不输出

  const site = resolveOrigins().site;
  const frag = document.createDocumentFragment();
  const add = (hreflang: string, href: string) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = href;
    link.setAttribute('data-hreflang', '');
    frag.appendChild(link);
  };
  // 规范策略（T08 方案甲）：英文版就是不带前缀的 /（和 x-default 同一个 URL，Google 允许），
  // /en… 只是它的别名（canonical 指回不带前缀的地址），其余语言各自带前缀。
  const unprefixed = `${site}${base === '' ? '/' : base}`;
  for (const lg of LANG_URLS) add(HREFLANG_MAP[lg], lg === 'en' ? unprefixed : `${site}/${lg}${base}`);
  add('x-default', unprefixed);
  document.head.appendChild(frag);
}

// og:locale 跟随当前语言；og:locale:alternate 列出其余语言（社交卡片的多语言声明）
function updateOgLocale() {
  const cur = OG_LOCALE_MAP[locale.value] || 'ja_JP';
  let meta = document.head.querySelector<HTMLMetaElement>('meta[property="og:locale"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', 'og:locale');
    document.head.appendChild(meta);
  }
  if (meta.content !== cur) meta.content = cur;
  document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el => el.remove());
  const frag = document.createDocumentFragment();
  for (const l of OG_LOCALE_ALL) {
    if (l === cur) continue;
    const m = document.createElement('meta');
    m.setAttribute('property', 'og:locale:alternate');
    m.content = l;
    frag.appendChild(m);
  }
  document.head.appendChild(frag);
}

// 根据当前路由计算「PC 自指 canonical」：所有页面都自指当前页。
// 移动端 alternate（m.blfans.ai）已移除（SEO T13）：m 站 canonical 指向主站首页，
// 两边互指反而让搜索引擎拿不准规范地址。
function computeSeoUrls(): { canonical: string } {
  const { site: SITE_ORIGIN } = resolveOrigins();
  const path = route.path;
  const q = route.query;

  const col = path.match(/^\/collection\/([^/?#]+)/);
  if (col) {
    return { canonical: `${SITE_ORIGIN}/collection/${col[1]}` };
  }

  const uh = path.match(/^\/user-home\/([^/?#]+)/);
  if (uh) {
    return { canonical: `${SITE_ORIGIN}/user-home/${uh[1]}` };
  }

  const det = path.match(/^\/detail\/([^/?#]+)/);
  if (det) {
    const id = det[1];
    const t = q.contentType ? String(q.contentType) : '';
    return { canonical: `${SITE_ORIGIN}/detail/${id}${t ? `?contentType=${t}` : ''}` };
  }

  // 其余页面（首页 / 语言页 / 分类页 / 静态页）：canonical 自指当前路径。
  // 分页页（?page=N，仅 SEO 预渲染时出现）要带上页码自指，不然第 2 页起会被当成第 1 页的重复页
  const pageNo = parseInt(String(q.page || ''), 10);
  const pageSuffix = pageNo > 1 ? `?page=${pageNo}` : '';
  // T08 方案甲：/en 和 /en/{type} 是不带前缀地址的别名，canonical 指回 / 和 /{type}，
  // 不然 / 与 /en 两个 URL 同一份英文内容，互为重复页
  const enAlias = path.match(/^\/en(\/(novel|comic|drama|photo|video))?\/?$/);
  const selfPath = enAlias ? (enAlias[1] || '/') : (path === '/' ? '/' : path);
  return { canonical: `${SITE_ORIGIN}${selfPath}${pageSuffix}` };
}

// 所有页面写 PC 自指 canonical。原地复用已有 <link>，值没变化就不动。
// 历史版本写过的移动端 alternate（link[rel=alternate][media]）这里顺手清掉。
function updateAltAndCanonical() {
  const { canonical } = computeSeoUrls();

  document.head.querySelectorAll('link[rel="alternate"][media]').forEach(el => el.remove());

  let can = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!can) {
    can = document.createElement('link');
    can.rel = 'canonical';
    can.setAttribute('data-canonical', '');
    document.head.appendChild(can);
  }
  if (can.href !== canonical) can.href = canonical;

  // og:url 跟 canonical 保持一致（index.html 里写死的是首页；详情/合集页自己会再覆盖成页面地址）
  let og = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (!og) {
    og = document.createElement('meta');
    og.setAttribute('property', 'og:url');
    document.head.appendChild(og);
  }
  if (og.content !== canonical) og.content = canonical;
}

onMounted(() => {
  // 埋点：首访（带推广来源）/ 会话开始结束 / 冷启动身份确认
  initTracking();
  void contentSwitch.ensureLoaded();
  updateBodyFontClass();
  updateHtmlLang();
  updateHreflang();
  updateOgLocale();
  updateAltAndCanonical();

  window.addEventListener('storage', (e) => {
    if (e.key == 'lang') {
      const newLang = e.newValue || 'en';
      if (newLang !== locale.value) {
        setLocale(newLang);
      }
      updateBodyFontClass();
      updateHtmlLang();
    }
  });

  watch(() => route.path, () => {
    updateBodyFontClass();
    updateHreflang();
  });

  // canonical/alternate 依赖 query（如 /detail/x?contentType=t），用 fullPath 监听。
  // flush: 'post'：等上一个页面卸载完再写——详情/合集页离开时会把自己改过的 og:url 还原成旧值，
  // 如果这里先写、它后还原，新页面的 og:url 就被还原成旧的了。
  watch(() => route.fullPath, () => {
    updateAltAndCanonical();
  }, { flush: 'post' });
});

watch(locale, () => {
  applyRouteTitle(route);
  updateBodyFontClass();
  updateHtmlLang();
  updateOgLocale();
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
