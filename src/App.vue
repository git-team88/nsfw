<template>
  <RouterView :key="route.path"></RouterView>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { locale } = useI18n();
const route = useRoute();
const router = useRouter();

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

const hreflangConfig = [
  { hreflang: 'ja', langPrefix: 'ja', i18nKey: 'jp' },
  { hreflang: 'zh-CN', langPrefix: 'zh-cn', i18nKey: 'zh' },
  { hreflang: 'zh-TW', langPrefix: 'zh-tw', i18nKey: 'tc' },
  { hreflang: 'en', langPrefix: 'en', i18nKey: 'en' },
  { hreflang: 'x-default', langPrefix: 'ja', i18nKey: 'jp' },
];

// 按当前 hostname 解析站点/移动端域名：正式站(*.moegen.ai)用正式域名，
// 其它（测试 testapp.addaiaroot.com / 本地）用测试域名，与 index.html 的判断保持一致。
function resolveOrigins() {
  const host = window.location.hostname;
  const isProd = host.endsWith('moegen.ai');
  return {
    site: isProd ? 'https://www.moegen.ai' : `https://${host}`,
    mobile: isProd ? 'https://m.moegen.ai' : 'https://m.addaiaroot.com',
  };
}

function updateBodyFontClass() {
  const lang = locale.value;
  const fontClass = languageFontMap[lang] || 'ja';

  document.body.classList.remove('en', 'ja', 'cn', 'tc');
  document.body.classList.add(fontClass);
}

function updateHtmlLang() {
  document.documentElement.lang = htmlLangMap[locale.value] || 'ja';
}

function updateHreflang() {
  // 移除已有 hreflang（含 index.html 里写死的 x-default），统一按当前域名重建
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

  const { site: SITE_ORIGIN } = resolveOrigins();
  const currentPath = route.path.replace(/^\/(ja|zh-tw|zh-cn|en)(\/)?/, '/');

  hreflangConfig.forEach(({ hreflang, langPrefix }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = `${SITE_ORIGIN}/${langPrefix}${currentPath}`;
    link.setAttribute('data-hreflang', hreflang);
    document.head.appendChild(link);
  });
}

// 根据当前路由计算「PC 自指 canonical」与「对应的移动端 alternate」URL。
// 映射规则（PC www.moegen.ai → 移动 m.moegen.ai，同一作品 id 通用）：
//   合集详情  /collection/:id            → /detail/book-public/:id
//   作品详情  /detail?id=x&contentType=t → /detail?id=x&source=t
//   社区主页  /user-home?id=x            → /user/x
//   首页/语言/分类页                      → 同路径（移动端补尾斜杠）
function computeSeoUrls(): { canonical: string; mobile: string } {
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

  // 首页 / 语言页 / 分类页 及其它：同路径互指，剔除跟踪参数
  const cleanPath = path === '/' ? '/' : path;
  return {
    canonical: `${SITE_ORIGIN}${cleanPath}`,
    mobile: `${MOBILE_ORIGIN}${cleanPath === '/' ? '/' : `${cleanPath}/`}`,
  };
}

// A/C 互指：写入 PC 自指 canonical + 指向移动端的 alternate。
// 全站各只保留一条（覆盖 index.html 里写死的首页 alternate）。
function updateAltAndCanonical() {
  const { canonical, mobile } = computeSeoUrls();

  document.querySelectorAll('link[rel="alternate"][media]').forEach(el => el.remove());
  const alt = document.createElement('link');
  alt.rel = 'alternate';
  alt.media = 'only screen and (max-width: 640px)';
  alt.href = mobile;
  alt.setAttribute('data-alt-mobile', '');
  document.head.appendChild(alt);

  document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
  const can = document.createElement('link');
  can.rel = 'canonical';
  can.href = canonical;
  can.setAttribute('data-canonical', '');
  document.head.appendChild(can);
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