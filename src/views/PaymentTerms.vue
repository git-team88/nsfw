<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="terms-detail-back" @click="goBack" v-if="!isHide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <span class="back-text">{{ t('back') }}</span>
      </div>

      <div class="terms-detail">
        <h1>{{ t('paymentTerms.title') }}</h1>
        <div v-html="t('paymentTerms.content')"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PaymentTerms">
import Header from "@/components/Header.vue";
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { initLanguage } from "@/util/utils";

const { t } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);
const isHide = ref(false);

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

  setNoIndexMeta();
});

onBeforeUnmount(() => {
  removeNoIndexMeta();
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
  background: #111111;

  .inner {
    max-width: 840px;
    width: 100%;
    margin: 0 auto 20px;
    padding: 0 30px;

    .terms-detail-back {
      position: absolute;
      top: 0;
      left: 30px;
      width: auto;
      height: 40px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f5f5f5;
      cursor: pointer;
      z-index: 10;
      border: 1px solid #3d3d3d;
      border-radius: 13px;
      background: #1a1a1a;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      padding: 0 10px;
      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

      .back-text {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
    }

    .terms-detail {
      margin: 0 auto 20px;
      font-size: 14px;
      line-height: 28px;
      color: #aaa;

      :deep(h1) {
        font-weight: bold;
        font-size: 24px;
        margin: 0 0 20px 0;
        color: #f5f5f5;
        text-align: center;
      }

      :deep(h2) {
        font-weight: bold;
        font-size: 18px;
        margin: 20px 0;
        padding-left: 6px;
        color: #f5f5f5;
      }

      :deep(h3) {
        font-weight: bold;
        font-size: 16px;
        margin: 28px 0;
        color: #f5f5f5;
      }

      :deep(a) {
        color: #ff4f9a;
        text-decoration: underline;
      }
    }
  }
}
</style>