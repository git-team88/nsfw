<template>
  <div class="subscription-failed-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <!-- <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
      </div> -->

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

<script setup lang="ts" name="SubscriptionFailed">
import Header from "@/components/Header.vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

function backToPayment() {
  const id = route.query.id;
  if (id) {
    router.replace({
      path: "/user-home",
      query: { id: id }
    });
  } else {
    router.replace('/')
  }
}
</script>

<style scoped lang="scss">
.subscription-failed-page {
  width: 100%;
  background: #FFFDF7;
}

.container {
  max-width: 650px;
  min-height: calc(100vh - 140px);
  margin: 120px auto 20px;
  padding: 24px 36px;
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
  padding: 40px 0;

  .page-title {
    font-size: 24px;
    font-weight: 800;
    color: #161122;
    margin-bottom: 20px;
  }

  .error-message {
    font-size: 14px;
    color: #161122;
    text-align: center;
    line-height: 20px;
  }

  .failed-icon {
    width: 80px;
    height: 80px;
    margin: 40px 0;
    background: #ef4444;
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

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 28px;
      height: 4px;
      background: #FFFDF7;
      border-radius: 2px;
    }

    &::before {
      transform: rotate(45deg);
    }

    &::after {
      transform: rotate(-45deg);
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