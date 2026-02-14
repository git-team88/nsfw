<template>
  <div class="terms">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="inner">
      <!-- <div class="terms-detail-back" @click="goBack">
        <img src="@/assets/images/base/back.png" alt="" />
      </div> -->

      <div class="terms-detail">
        <h1>{{ t('paymentTerms.title') }}</h1>
        <div v-html="t('paymentTerms.content')"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PaymentTerms">
import Header from "@/components/Header.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const headerRef = ref<InstanceType<typeof Header> | null>(null);

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