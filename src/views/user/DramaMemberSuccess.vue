<template>
  <div class="drama-member-success-page">
    <Header :cur="-1"></Header>
    <div class="container">
      <!-- <div class="back" @click="router.back()">
        <img src="@/assets/images/base/back.png" alt="" />
      </div> -->

      <div class="content-box">
        <h1 class="page-title">{{ t("user.dramaMember.paySuccessTitle") }}</h1>

        <div class="error-message">
          <p>{{ t("user.dramaMember.paySuccessLine1") }}</p>
          <p>{{ t("user.dramaMember.paySuccessLine2") }}</p>
        </div>

        <!-- Success Icon -->
        <div class="success-icon">
          <img src="@/assets/images/user/success_icon.png" alt="" />
        </div>

        <!-- Back Button -->
        <button class="back-btn" @click="goHome">
          {{ t("user.dramaMember.backHome") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DramaMemberSuccess">
import Header from "@/components/Header.vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();

// 漫剧会员的购买由后端在支付回调里上报 GA（Measurement Protocol），页面不再报 purchase

// 个人中心入口的会员支付成功页（/drama-member-success）；详情页入口回跳漫剧解锁的 /drama-unlock-success
function goHome() {
  router.replace("/");
}
</script>

<style scoped lang="scss">
.drama-member-success-page {
  width: 100%;
  min-height: 100vh;
  padding: 140px 0 0;
  background: #1a1a1a;
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
    color: #f5f5f5;
  }

  .error-message {
    font-size: 14px;
    color: #f5f5f5;
    text-align: center;
    line-height: 20px;
    margin-top: 40px;
    p {
      margin: 0 0 6px;
    }
  }

  .contact-link {
    color: #ff4f9a;
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
    border: 1px solid #3d3d3d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
    animation: chPanelIn 0.6s cubic-bezier(0.16,1,0.3,1) both;

    img {
      display: none;
    }

    &::after {
      content: '';
      width: 20px;
      height: 36px;
      border: solid #1a1a1a;
      border-width: 0 5px 5px 0;
      transform: rotate(45deg);
      position: relative;
      top: -6px;
    }
  }

  .back-btn {
    min-width: 240px;
    height: 48px;
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    box-shadow: 0 0 16px rgba(255, 61, 134, .3);
    color: #FFFFFF;
    border: 2px solid #ff9aca;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 0 22px rgba(255, 61, 134, .35);
    transition: box-shadow 0.14s;
  }
}

@keyframes chPanelIn {
  0% { opacity: 0; transform: scale(.92) translateY(-6px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 768px) {
  .drama-member-success-page {
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
  .drama-member-success-page {
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
