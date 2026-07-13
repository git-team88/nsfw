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

const SITE_ORIGIN = 'https://www.moegen.ai';

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
  document.querySelectorAll('link[data-hreflang]').forEach(el => el.remove());

  const currentPath = route.path.replace(/^\/(ja|zh-tw|zh-cn|en)(\/)?/, '/');

  hreflangConfig.forEach(({ hreflang, langPrefix }) => {
    if (hreflang === 'x-default') return;
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = hreflang;
    link.href = `${SITE_ORIGIN}/${langPrefix}${currentPath}`;
    link.setAttribute('data-hreflang', hreflang);
    document.head.appendChild(link);
  });
}

onMounted(() => {
  updateBodyFontClass();
  updateHtmlLang();
  updateHreflang();

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
});

watch(locale, () => {
  updateBodyFontClass();
  updateHtmlLang();
});
</script>