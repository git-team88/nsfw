<template>
  <div class="subscription-success-page">
    <Header :cur="-1"></Header>
    <div class="container">

      <div class="content-box">
        <h1 class="page-title">{{ t("subscribe.success.title") }}</h1>

        <p class="error-message">{{ t("subscribe.success.message") }}</p>

        <!-- Success Icon -->
        <div class="success-icon">
          <img src="@/assets/images/user/success_icon.png" alt="" />
        </div>

        <!-- Back Buttons -->
        <div class="button-group">
          <button class="back-home-btn" @click="backToHome">
            {{ t("subscribe.success.backToHome") }}
          </button>
          <button class="back-btn" @click="backToMyProjects">
            {{ t("subscribe.success.backToMyProjects") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AIToolPaymentSuccess">
import Header from "@/components/Header.vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

function backToHome() {
  router.replace('/');
}

function backToMyProjects() {
  router.replace('/my-projects');
}
</script>

<style scoped lang="scss">
.subscription-success-page {
  width: 100%;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}

.container {
  max-width: 72rem;
  min-height: calc(100vh - 14rem);
  margin: 12rem auto 2rem;
  padding: 6rem 3.6rem 2.4rem;
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

    .page-title {
      font-size: 2rem;
      font-weight: 500;
      color: #101828;
    }

    .error-message {
      font-size: 1.4rem;
      color: #6A7282;
      text-align: center;
      line-height: 2rem;
      margin-bottom: 4rem;
    }

    .success-icon {
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

    .button-group {
      display: flex;
      gap: 2rem;
      margin-top: 2rem;
    }

    .back-home-btn{
      width: 24rem;
      height: 4.8rem;
      border: 1px solid #fb64b6;
      border-radius: 0.8rem;
      font-size: 1.6rem;
      font-weight: 500;
      background: none;
      cursor: pointer;
      color: #fb64b6;
      transition: opacity 0.2s;

      &:hover {
        background: rgba(251, 100, 182, 0.06);
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
          background: rgba(255, 255, 255, 0.2);
          z-index: 1;
        }
      }
    }
  }
</style>