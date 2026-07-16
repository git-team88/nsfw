<template>
  <div class="account-success-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="content-box">
        <h1 class="page-title">{{ t("user.account.success.title") }}</h1>
        <p class="message">{{ t("user.account.success.message") }}</p>
        <div class="success-icon">
          <img src="@/assets/images/user/success_icon.png" alt="" />
        </div>
        <button class="back-btn" @click="backToSubscription">
          {{ t("user.account.success.back") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AccountSuccess">
import Header from "@/components/Header.vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

function backToSubscription() {
  router.replace("/user-subscription");
}
</script>

<style scoped lang="scss">
.account-success-page {
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

  .message {
    font-size: 14px;
    color: #161122;
    text-align: center;
    line-height: 20px;
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