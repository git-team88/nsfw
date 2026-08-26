<template>
  <div class="privacy">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="privacy-detail-back" @click="goBack" v-if="!isHide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="privacy-detail" v-html="t('privacy')"></div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Privacy">
import Header from "@/components/Header.vue";

import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { initLanguage } from "@/util/utils";

const router = useRouter();
const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const isWallet = ref(false);
const isBind = ref(false);
const isHide = ref(false);

function setSeoMeta() {
  document.title = t('seo.privacy.title');

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.privacy.keywords'));

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.privacy.description'));
}

function setNoIndexMeta() {
  let metaRobots = document.querySelector('meta[name="robots"]');
  if (!metaRobots) {
    metaRobots = document.createElement('meta');
    metaRobots.setAttribute('name', 'robots');
    document.head.appendChild(metaRobots);
  }
  metaRobots.setAttribute('content', 'noindex, nofollow');
}

function removeNoIndexMeta() {
  const metaRobots = document.querySelector('meta[name="robots"]');
  if (metaRobots && metaRobots.getAttribute('content') === 'noindex, nofollow') {
    metaRobots.parentNode?.removeChild(metaRobots);
  }
}

onMounted(async () => {
  // 初始化语言设置
  await initLanguage();

  window.scrollTo(0, 0);

  const isBack = localStorage.getItem("isBack");
  if (isBack) {
    isHide.value = true;
    localStorage.removeItem("isBack");
  }

  setSeoMeta();
  setNoIndexMeta();
});

onBeforeUnmount(() => {
  removeNoIndexMeta();
});

watch(() => locale.value, () => {
  setSeoMeta();
});

function goBack() {
  router.go(-1);
}
</script>

<style lang="scss" scoped>
.privacy {
  position: relative;
  width: 100%;
  min-height: 100vh;
  scroll-behavior: smooth;
  padding: 140px 0 0;
  background: #1a1a1a;

  .inner {
    max-width: 840px;
    width: 100%;
    margin: 0 auto 20px;
    padding: 0 30px;

    .privacy-detail-back {
      position: absolute;
      top: 0;
      left: 30px;
      width: auto;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ddd;
      cursor: pointer;
      z-index: 10;
      border: 1px solid #3d3d3d;
      border-radius: 12px;
      background: #1a1a1a;
      box-shadow: none;
      padding: 0 10px;
      transition: border-color 0.15s, color 0.15s;

      .back-text {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      &:hover {
        border-color: #ff4f9a;
        color: #fff;
      }
    }

    .privacy-detail {
      margin: 0 auto 20px;
      font-size: 14px;
      line-height: 28px;
      color: #ccc;

      :deep(h1) {
        font-weight: bold;
        font-size: 24px;
        margin: 0 0 10px 0;
        color: #f5f5f5;
      }
      :deep(.sub) {
        color: #777;
        margin-top: 0;
      }
      :deep(.meta) {
        color: #aaa;
        margin-bottom: 20px;
        font-size: 14px;
      }
      :deep(.meta a) {
        color: #ff4f9a;
        text-decoration: none;
      }
      :deep(.meta a:hover) {
        text-decoration: underline;
      }
      :deep(h2) {
        font-weight: bold;
        font-size: 20px;
        margin: 30px 0;
        border-left: 4px solid #ff4f9a;
        padding-left: 6px;
        color: #f5f5f5;
      }
      :deep(h3) {
        font-weight: bold;
        font-size: 17.5px;
        margin: 28px 0;
        color: #f5f5f5;
      }
      :deep(p) {
        margin: 15px 0;
      }
      :deep(ul) {
        padding-left: 18px;
        list-style: disc;
      }
      :deep(li) {
        list-style: disc;
      }
      :deep(code) {
        background: rgba(255,79,154,0.12);
        padding: 7px 9px;
        border-radius: 4px;
      }
      :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 16px;
      }
      :deep(th),
      :deep(td) {
        border: 1px solid #2c2c2c;
        padding: 12px 11px;
        vertical-align: top;
      }
      :deep(thead th) {
        background: rgba(255,255,255,0.04);
        text-align: left;
      }
      :deep(.notice) {
        background: rgba(255,79,154,0.12);
        border: 1px solid #ff4f9a;
        padding: 14px 16px;
        border-radius: 8px;
      }
      :deep(footer) {
        margin-top: 50px;
        color: #777;
        font-size: 14px;
      }
      :deep(a) {
        color: #ff4f9a;
        text-decoration: underline;
      }
    }
  }
}
</style>
