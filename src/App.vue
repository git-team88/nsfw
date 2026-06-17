<template>
  <RouterView :key="route.path"></RouterView>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { locale } = useI18n();
const route = useRoute();

// Language to font class mapping
const languageFontMap: Record<string, string> = {
  'en': 'en',
  'jp': 'ja',
  'zh': 'cn',
  'tc': 'tc'
};

function updateBodyFontClass() {
  const lang = locale.value;
  const fontClass = languageFontMap[lang] || 'ja';

  // Remove all language font classes
  document.body.classList.remove('en', 'ja', 'cn', 'tc');

  // Add current language font class
  document.body.classList.add(fontClass);
}

onMounted(() => {
  updateBodyFontClass();

  // Listen for storage changes (when language is changed in another tab/window)
  window.addEventListener('storage', (e) => {
    if (e.key == 'lang') {
      const newLang = e.newValue || 'jp';
      if (newLang !== locale.value) {
        locale.value = newLang;
      }
      updateBodyFontClass();
    }
  });

  // Watch for route changes to re-apply font class
  watch(() => route.path, () => {
    updateBodyFontClass();
  });
});

// Watch for locale changes
watch(locale, () => {
  updateBodyFontClass();
});
</script>