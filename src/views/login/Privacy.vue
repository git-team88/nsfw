<template>
  <div class="privacy">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="privacy-detail-back" @click="goBack" v-if="!isHide">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="privacy-detail" v-html="t('privacy')"></div>
    </div>
  </div>
</template>

<script setup lang="ts" name="Privacy">
import Header from "@/components/Header.vue";

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t, locale } = useI18n();

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
.privacy {
  position: relative;
  width: 100%;
  min-height: 100vh;
  scroll-behavior: smooth;
  padding: 14rem 0 0;
  background: #FFFFFF;

  background-attachment: fixed;

  .inner {
    max-width: 144rem;
    width: 100%;
    margin: 0 auto 2rem;

    .privacy-detail-back {
      position: fixed;
      left: 50%;
      top: 12rem;
      width: 4rem;
      height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateX(-55rem);
      cursor: pointer;
      z-index: 10;

      img {
        width: 4rem;
        height: 4rem;
      }
    }

    .privacy-detail {
      max-width: 86rem;
      margin: 0 auto 2rem;
      font-size: 1.4rem;
      line-height: 2.8rem;
      color: #364153;

      :deep(h1) {
        font-weight: 500;
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
        font-weight: 500;
        font-size: 2rem;
        margin: 3rem 0;
        border-left: 4px solid #00ffff;
        padding-left: 0.6rem;
        color: rgba(255, 255, 255, 0.9);
      }
      :deep(h3) {
        font-weight: 500;
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
