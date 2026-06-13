<template>
  <div class="subscription-success-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <!-- <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
      </div> -->

      <div class="content-box">
        <h1 class="page-title">{{ t("subscribe.success.title") }}</h1>

        <p class="error-message">{{ t("subscribe.success.message") }}</p>

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

const sessionId = (route.query.session_id || route.query.order_id || "") as string;
if (sessionId) {
  trackPurchase({
    paymentType: "subscription",
    value: Number(route.query.amount || 0),
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
  background: #FFFFFF;
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

  .back {
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
      }
    }
  }
}
</style>