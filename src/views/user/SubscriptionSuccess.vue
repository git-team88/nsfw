<template>
  <div class="subscription-success-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <!-- <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
      </div> -->

      <div class="content-box">
        <h1 class="page-title">{{ t("subscribe.success.title") }}</h1>

        <div class="error-message">
          <p>{{ t("subscribe.success.line1") }}</p>
          <p>{{ t("subscribe.success.line2") }}</p>
          <p>
            {{ t("subscribe.success.supportEmail") }}support@moegen.ai
          </p>
          <p>
            {{ t("subscribe.success.discord") }}
            <a class="contact-link" href="https://discord.gg/kWkuYjs9" target="_blank" rel="noopener">https://discord.gg/kWkuYjs9</a>
          </p>
        </div>

        <!-- Success Icon -->
        <div class="success-icon">
          <img src="@/assets/images/user/success_icon.png" alt="" />
        </div>

        <!-- Back Button -->
        <button class="back-btn" @click="backToCommunity">
          {{ t("subscribe.success.back") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SubscriptionSuccess">
import Header from "@/components/Header.vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { trackPurchase } from "@/utils/analytics";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const amount = Number(route.query.amount || 0);
if (amount > 0) {
  trackPurchase({
    paymentType: "1",
    value: amount,
    currency: (route.query.currency || "JPY") as string,
  });
}

function backToCommunity() {
  const id = route.query.id;
  if (id) {
    router.replace({
      path: "/user-home",
      query: { id: id }
    });
  } else {
    router.replace('/');
  }
}
</script>

<style scoped lang="scss">
.subscription-success-page {
  width: 100%;
  min-height: 100vh;
  padding: 140px 0 0;
  background: #FFFBF4;
}

.container {
  max-width: 650px;
  margin: 0 auto;
  padding: 0 28px;
}

.content-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .page-title {
    font-size: 20px;
    font-weight: 800;
    color: #161122;
  }

  .error-message {
    font-size: 14px;
    color: #161122;
    text-align: center;
    line-height: 20px;
    margin-top: 40px;
    p {
      margin: 0 0 6px;
    }
  }

  .contact-link {
    color: #FF4D8E;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  .success-icon {
    width: 80px;
    height: 80px;
    margin: 40px 0 60px;
    background: #22c55e;
    border: 3px solid #161122;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 4px 4px 0 rgba(22,17,34,0.14);
    animation: chPanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;

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

  .back-btn {
    min-width: 240px;
    height: 48px;
    background: linear-gradient(135deg, #FF4D8D, #FF7A45);
    color: #FFFFFF;
    border: 2px solid #161122;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 2px 2px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 3px 3px 0 #161122;
    }
  }
}

@keyframes chPanelIn {
  0% { opacity: 0; transform: scale(.92) translateY(-6px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 768px) {
  .subscription-success-page {
    padding: 80px 0 0;
  }
  .container {
    padding: 0 20px;
  }
  .content-box {
    .page-title {
      font-size: 18px;
    }
    .success-icon {
      margin: 30px 0 40px;
    }
    .back-btn {
      min-width: 160px;
      height: 44px;
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .subscription-success-page {
    padding: 70px 0 0;
  }
  .container {
    padding: 0 16px;
  }
  .content-box {
    .page-title {
      font-size: 16px;
    }
    .success-icon {
      margin: 24px 0 30px;
    }
    .back-btn {
      width: 100%;
      min-width: unset;
    }
  }
}
</style>