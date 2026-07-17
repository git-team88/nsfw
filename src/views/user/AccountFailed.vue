<template>
  <div class="account-failed-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <div class="content-box">
        <h1 class="page-title">{{ t("user.account.failed.title") }}</h1>
        <p class="message">{{ t("user.account.failed.message") }}</p>
        <div class="failed-icon">
          <img src="@/assets/images/user/fail_icon.png" alt="" />
        </div>
        <button class="back-btn" @click="backToSubscription">
          {{ t("user.account.failed.back") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="AccountFailed">
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
.account-failed-page {
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
    margin-bottom: 20px;
  }

  .message {
    font-size: 14px;
    color: #161122;
    text-align: center;
    line-height: 20px;
  }

  .failed-icon {
    width: 80px;
    height: 80px;
    margin: 40px 0 60px;
    background: #ef4444;
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
  .account-failed-page {
    padding: 80px 0 0;
  }
  .container {
    padding: 0 20px;
  }
  .content-box {
    .page-title {
      font-size: 18px;
    }
    .failed-icon {
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
  .account-failed-page {
    padding: 70px 0 0;
  }
  .container {
    padding: 0 16px;
  }
  .content-box {
    .page-title {
      font-size: 16px;
    }
    .failed-icon {
      margin: 24px 0 30px;
    }
    .back-btn {
      width: 100%;
      min-width: unset;
    }
  }
}
</style>