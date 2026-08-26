<template>
  <RouterView :key="routeViewKey"></RouterView>
</template>

<script setup lang="ts">
import { watch, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { locale } = useI18n();
const route = useRoute();
const router = useRouter();

// 首页各内容类型路由（/、/{lang}、/{lang}/{type}、/{type}）共用同一 key，
// 使切换内容类型 tab 时不触发 Home 组件重挂载（避免重新请求首页所有接口）；
// 其它页面仍按 path 作为 key。
const routeViewKey = computed(() => {
  const path = route.fullPath;
  const LANGS = 'ja|en|zh-cn|zh-tw';
  const TYPES = 'novel|comic|drama|photo|video';
  const isHome =
    path === '/' ||
    new RegExp(`^/(${LANGS})(/(${TYPES}))?/?$`).test(path) ||
    new RegExp(`^/(${TYPES})/?$`).test(path);
  return isHome ? 'home' : path;
});

const languageFontMap: Record<string, string> = {
  'en': 'en',
  'jp': 'ja',
  'zh': 'cn',
  'tc': 'tc'
};

const htmlLangMap: Record<string, string> = {
  'jp': 'ja',
  'en': 'en',
  'zh': 'zh-CN',
  'tc': 'zh-TW'
};

// 站点地址（canonical 用）始终用当前实际访问地址（含协议/端口/域名）；
// 移动端域名仍按正式/测试区分：正式站(*.moegen.ai)→ m.moegen.ai，其它 → m.addaiaroot.com。
function resolveOrigins() {
  const host = window.location.hostname;
  const isProd = host.endsWith('moegen.ai');
  return {
    site: window.location.origin,
    mobile: isProd ? 'https://m.moegen.ai' : 'https://m.addaiaroot.com',
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
//   作品详情  /detail?id=x&contentType=t → /detail?id=x&source=t
//   社区主页  /user-home?id=x            → /user/x
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

  if (path === '/user-home' && q.id) {
    return {
      canonical: `${SITE_ORIGIN}/user-home?id=${q.id}`,
      mobile: `${MOBILE_ORIGIN}/user/${q.id}`,
    };
  }

  if (path === '/detail' && q.id) {
    // contentType 直接透传成移动端的 source（novel/comic/video…）
    const t = q.contentType ? String(q.contentType) : '';
    return {
      canonical: `${SITE_ORIGIN}/detail?id=${q.id}${t ? `&contentType=${t}` : ''}`,
      mobile: `${MOBILE_ORIGIN}/detail?id=${q.id}${t ? `&source=${t}` : ''}`,
    };
  }

  // 首页 / 语言页 / 分类页（Home 组件）：canonical 自指当前页；移动端 alternate 指向 m 站首页。
  // 用路径判断而非 route.name（初始加载 / SEO 渲染时 route.name 可能尚未就绪）。
  //   / | /{lang} | /{lang}/{type} | /{type}
  const cleanPath = path === '/' ? '/' : path;
  const LANGS = 'ja|en|zh-cn|zh-tw';
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
  updateBodyFontClass();
  updateHtmlLang();
  updateHreflang();
  updateAltAndCanonical();

  window.addEventListener('storage', (e) => {
    if (e.key == 'lang') {
      const newLang = e.newValue || 'jp';
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

  // canonical/alternate 依赖 query（如 /detail?id=x），用 fullPath 监听
  watch(() => route.fullPath, () => {
    updateAltAndCanonical();
  });
});

watch(locale, () => {
  updateBodyFontClass();
  updateHtmlLang();
});
</script>