<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="terms-detail-back" @click="goBack" v-if="!isHide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </div>

      <div class="terms-detail" v-html="t('agreement')"></div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Terms">
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
  document.title = t('seo.terms.title');

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.terms.keywords'));

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.terms.description'));
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
.terms {
  position: relative;
  width: 100%;
  min-height: 100vh;
  scroll-behavior: smooth;
  padding: 140px 0 0;
  background: #FFFDF7;

  .inner {
    max-width: 840px;
    width: 100%;
    margin: 0 auto 20px;
    padding: 0 30px;

    .terms-detail-back {
      position: absolute;
      top: 0;
      left: 30px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #161122;
      cursor: pointer;
      z-index: 10;
      border: 2.5px solid #161122;
      border-radius: 13px;
      background: #FFFDF7;
      box-shadow: 3px 3px 0 #161122;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 5px 5px 0 #161122;
      }
    }

    .terms-detail {
      margin: 0 auto 20px;
      font-size: 14px;
      line-height: 28px;
      color: #364153;

      :deep(h1) {
        font-weight: bold;
        font-size: 24px;
        margin: 0 0 10px 0;
        color: #161122;
      }
      :deep(.sub) {
        color: #9a93a4;
        margin-top: 0;
      }
      :deep(.meta) {
        color: #5b5566;
        margin-bottom: 20px;
        font-size: 14px;
      }
      :deep(.meta a) {
        color: #FF4D8D;
        text-decoration: none;
      }
      :deep(.meta a:hover) {
        text-decoration: underline;
      }
      :deep(h2) {
        font-weight: bold;
        font-size: 20px;
        margin: 30px 0;
        border-left: 4px solid #FF4D8D;
        padding-left: 6px;
        color: #161122;
      }
      :deep(h3) {
        font-weight: bold;
        font-size: 17.5px;
        margin: 28px 0;
        color: #161122;
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
        background: rgba(255,77,141,0.08);
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
        border: 1px solid rgba(22,17,34,0.12);
        padding: 12px 11px;
        vertical-align: top;
      }
      :deep(thead th) {
        background: rgba(22,17,34,0.04);
        text-align: left;
      }
      :deep(.notice) {
        background: rgba(255,77,141,0.08);
        border: 1px solid #FF4D8D;
        padding: 14px 16px;
        border-radius: 8px;
      }
      :deep(footer) {
        margin-top: 50px;
        color: #9a93a4;
        font-size: 14px;
      }
      :deep(a) {
        color: #FF4D8D;
        text-decoration: underline;
      }
    }
  }
}
</style>
