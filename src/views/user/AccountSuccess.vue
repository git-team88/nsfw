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
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}

.container {
  width: 72rem;
  min-height: calc(100vh - 14rem);
  margin: 12rem auto 2rem;
  padding: 6rem 3.6rem 2.4rem;
  position: relative;
  border: 1px solid rgba(251, 100, 182, 0.2);
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

  .message {
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
    min-width: 25rem;
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