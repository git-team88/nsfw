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
import { trackPurchase } from "@/utils/analytics";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const amount = Number(route.query.amount || 0);
if (amount > 0) {
  const mode = (route.query.mode || "") as string;
  const paymentType = mode === "subscription" ? "2" : mode === "payment" ? "3" : "2";
  trackPurchase({
    paymentType,
    value: amount,
    currency: (route.query.currency || "JPY") as string,
  });
}

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
  background: #FFFDF7;
}

.container {
  max-width: 650px;
  min-height: calc(100vh - 140px);
  margin: 120px auto 20px;
  padding: 60px 36px 24px;
  background: #FFFDF7;
  border: 3px solid #161122;
  border-radius: 6px;
  box-shadow: 3px 3px 0 #161122;
}

.content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .page-title {
    font-size: 24px;
    font-weight: 800;
    color: #161122;
  }

  .error-message {
    font-size: 14px;
    color: #161122;
    text-align: center;
    line-height: 20px;
    margin-bottom: 40px;
  }

  .success-icon {
    width: 80px;
    height: 80px;
    margin: 40px 0;
    background: #22c55e;
    border: 3px solid #161122;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 3px 3px 0 #161122;

    img {
      display: none;
    }

    &::after {
      content: '';
      width: 20px;
      height: 36px;
      border: solid #FFFDF7;
      border-width: 0 5px 5px 0;
      transform: rotate(45deg);
      position: relative;
      top: -6px;
    }
  }

  .button-group {
    display: flex;
    gap: 20px;
    margin-top: 20px;
  }

  .back-home-btn {
    min-width: 250px;
    height: 48px;
    background: #FFFDF7;
    color: #161122;
    border: 2.5px solid #161122;
    border-radius: 13px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.1s, box-shadow 0.1s;

    &:hover {
      box-shadow: 1px 1px 0 #161122;
      transform: translate(2px, 2px);
    }
  }

  .back-btn {
    min-width: 250px;
    height: 48px;
    background: #FF4D8D;
    color: #FFFDF7;
    border: 2.5px solid #161122;
    border-radius: 13px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.1s, box-shadow 0.1s;

    &:hover {
      box-shadow: 1px 1px 0 #161122;
      transform: translate(2px, 2px);
    }
  }
}
</style>