<template>
  <div class="subscription-failed-page">
    <Header :cur="-1"></Header>
    <div class="container">

      <div class="content-box">
        <h1 class="page-title">{{ t("subscribe.failed.title") }}</h1>

        <!-- Error Message -->
        <p class="error-message">{{ t("subscribe.failed.message") }}</p>

        <!-- Failed Icon -->
        <div class="failed-icon">
          <img src="@/assets/images/user/fail_icon.png" alt="" />
        </div>

        <!-- Back Button -->
        <button class="back-btn" @click="backToPayment">
          {{ t("subscribe.failed.back") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AIToolPaymentFailed">
import Header from "@/components/Header.vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

function backToPayment() {
  router.replace('/ai-recharge');
}
</script>

<style scoped lang="scss">
.subscription-failed-page {
  width: 100%;
  background: #FFFFFF;
}

.container {
  width: 72rem;
  min-height: calc(100vh - 14rem);
  margin: 12rem auto 2rem;
  padding: 2.4rem 3.6rem;
  position: relative;
  border: 1px solid rgba(251, 100, 182, 0.2);
  -webkit-border-radius: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.8);
}

.content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;

  .page-title {
    font-size: 2rem;
    font-weight: 500;
    color: #101828;
    margin-bottom: 2rem;
  }

  .error-message {
    font-size: 1.4rem;
    color: #6A7282;
    text-align: center;
    line-height: 2rem;
  }

  .failed-icon {
    width: 24rem;
    height: 24rem;
    margin: 4rem 0;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .back-btn {
    width: 24rem;
    height: 4.8rem;
    background: #fb64b6;
    color: #ffffff;
    border: none;
    border-radius: 0.8rem;
    font-size: 1.6rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      position: relative;

      &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
        z-index: 1;
      }
    }
  }
}
</style>