<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="terms-detail-back" @click="goBack" v-if="!isHide">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="terms-detail" v-html="t('communityConvention')"></div>
    </div>
  </div>
</template>

<script setup lang="ts" name="CommunityConvention">
import Header from "@/components/Header.vue";

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const isWallet = ref(false);
const isBind = ref(false);
const isHide = ref(false);

onMounted(async () => {
  window.scrollTo(0, 0);

  const isBack = localStorage.getItem("isBack");
  if (isBack) {
    isHide.value = true;
    localStorage.removeItem("isBack");
  }
});

function goBack() {
  router.go(-1);
}
</script>

<style lang="scss" scoped>
.terms {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 12rem 0 0;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;

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
      border: 1px solid rgba(251, 100, 182, 0.2);
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      cursor: pointer;
      z-index: 10;

      &:hover {
        border: 1px solid rgba(251, 100, 182, 0.5);
        background: rgba(251, 100, 182, 0.06);
      }

      img {
        width: 2.4rem;
        height: 2.4rem;
      }
    }

    .terms-detail {
      max-width: 92rem;
      min-height: calc(100vh - 12rem);
      margin: 0 auto;
      padding: 3rem;
      border: 1px solid rgba(251,100,182,0.2);
      -webkit-border-radius: 1.2rem;
      border-radius: 1.2rem;
      line-height: 1.7;
      background: rgba(255,255,255,0.8);
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
</style>