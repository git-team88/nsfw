<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="terms-detail-back" @click="goBack" v-if="!isHide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </div>

      <div class="terms-detail" v-html="t('communityConvention')"></div>
    </div>
  </div>
</template>

<script setup lang="ts" name="CommunityConvention">
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
  document.title = t('seo.communityConvention.title');

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.communityConvention.keywords'));

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.communityConvention.description'));
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
  padding: 14rem 0 0;
  background: #FFFFFF;

  .inner {
    max-width: 144rem;
    width: 100%;
    margin: 0 auto 2rem;

    .terms-detail-back {
      position: fixed;
      left: 50%;
      top: 12rem;
      width: 4rem;
      height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-55rem);
      color: #fff;
      cursor: pointer;
      z-index: 10;
      border: 2px solid #fff;
      border-radius: 1.3rem;
      box-shadow: 0.3rem 0.3rem 0 #fff;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      &:hover {
        transform: translateX(-55rem) translateY(-1px);
        box-shadow: 0.4rem 0.4rem 0 #fff;
      }
    }

    .terms-detail {
      max-width: 86rem;
      margin: 0 auto 2rem;
      font-size: 1.4rem;
      line-height: 2.8rem;
      color: #364153;

      :deep(h1) {
        font-weight: bold;
        font-size: 2.4rem;
        margin: 0 0 1rem 0;
        color: rgba(255, 255, 255, 0.9);
      }
      :deep(.sub) {
        color: rgba(255, 255, 255, 0.5);
        margin-top: 0;
      }
      :deep(.meta) {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 2rem;
        font-size: 1.4rem;
      }
      :deep(.meta a) {
        color: #00ffff;
        text-decoration: none;
      }
      :deep(.meta a:hover) {
        text-decoration: underline;
      }
      :deep(h2) {
        font-weight: bold;
        font-size: 2rem;
        margin: 3rem 0;
        border-left: 4px solid #00ffff;
        padding-left: 0.6rem;
        color: rgba(255, 255, 255, 0.9);
      }
      :deep(h3) {
        font-weight: bold;
        font-size: 1.75rem;
        margin: 2.8rem 0;
        color: rgba(255, 255, 255, 0.9);
      }
      :deep(p) {
        margin: 1.5rem 0;
      }
      :deep(ul) {
        padding-left: 1.8rem;
        list-style: disc;
      }
      :deep(li) {
        list-style: disc;
      }
      :deep(code) {
        background: rgba(0, 255, 255, 0.12);
        padding: 0.7rem 0.9rem;
        border-radius: 4px;
      }
      :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 1.6rem 0;
        font-size: 1.6rem;
      }
      :deep(th),
      :deep(td) {
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 1.2rem 1.1rem;
        vertical-align: top;
      }
      :deep(thead th) {
        background: rgba(255, 255, 255, 0.06);
        text-align: left;
      }
      :deep(.notice) {
        background: rgba(0, 255, 255, 0.12);
        border: 1px solid #00ffff;
        padding: 1.4rem 1.6rem;
        border-radius: 8px;
      }
      :deep(footer) {
        margin-top: 5rem;
        color: rgba(255, 255, 255, 0.3);
        font-size: 1.4rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .terms {
    padding: 10rem 0 0;
  }
  .inner .terms-detail-back {
    position: fixed;
    left: 1rem;
    top: 10rem;
    transform: none;
    &:hover {
      transform: translateY(-1px);
    }
  }
  .inner .terms-detail {
    max-width: 100%;
    padding: 0 1rem;
    font-size: 1.2rem;
    line-height: 2.4rem;
  }
}

@media (max-width: 480px) {
  .terms {
    padding: 8rem 0 0;
  }
  .inner .terms-detail-back {
    left: 1rem;
    top: 8rem;
  }
  .inner .terms-detail {
    font-size: 1.1rem;
    line-height: 2rem;
    :deep(h1) {
      font-size: 1.8rem;
    }
    :deep(h2) {
      font-size: 1.5rem;
    }
    :deep(h3) {
      font-size: 1.3rem;
    }
  }
}
</style>