<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <div class="terms-detail-back" @click="goBack" v-if="!isHide">
        <img src="@/assets/images/base/back.png" alt="" />
      </div>

      <div class="terms-detail" v-html="t('computingPowerRules')">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ComputingPowerRules">
import Header from "@/components/Header.vue";
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

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
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 12rem 0 0;
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
      cursor: pointer;
      z-index: 10;

      img {
        width: 4rem;
        height: 4rem;
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
        margin: 0 0 2rem 0;
        color: #364153;
        text-align: center;
      }

      :deep(h2) {
        font-weight: bold;
        font-size: 1.8rem;
        margin: 2rem 0;
        padding-left: 0.6rem;
        color: #364153;
      }

      :deep(h3) {
        font-weight: bold;
        font-size: 1.6rem;
        margin: 2.8rem 0;
        color: #364153;
      }
    }
  }
}
</style>