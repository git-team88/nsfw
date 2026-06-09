<template>
  <div class="reset">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="container">
      <div class="title">{{ t("header.reset.title") }}</div>

      <div class="step">
        <div class="step-item">
          <span>{{ t("register.step1") }}</span>
          <span>{{ t("header.reset.btn") }}</span>
        </div>

        <b></b>
        <div class="step-item on">
          <span>{{ t("register.step2") }}</span>
          <span>{{ t("header.reset.link") }}</span>
        </div>
      </div>

      <div class="content">
        <p>{{ t("header.reset.info1") }}</p>
        <p>{{ t("header.reset.info2") }}</p>
      </div>

      <div class="reset-btn-box">
        <span class="reset-btn" @click="confirmReset()">{{ t("header.reset.login") }}</span>
        <span class="reset-back" @click="backReset()">{{ t("header.reset.resend") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ResetSend">
import Header from "@/components/Header.vue";
import router from "@/router";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { initLanguage } from "@/util/utils";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

onMounted(async () => {
  // 初始化语言设置
  await initLanguage();

  const token = localStorage.getItem("token");

  if (token) {
    router.push("/");
    return false;
  }
});
function backReset() {
  router.push("/reset-password");
}

function confirmReset() {
  router.push("/login");
}
</script>

<style lang="scss" scoped>
.reset {
  width: 100%;
  height: 100vh;
  background: #FFFFFF;

  .container {
    max-width: 48rem;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 16rem 0 3rem;

    .title {
      font: {
        weight: 500;
        size: 2rem;
      }
      line-height: 2rem;
      text-align: center;
      color: #101828;
    }

    .step {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      margin: 4rem 0;

      .step-item {
        position: relative;
        padding: 0 0 2.4rem;

        &.on {
          span {
            color: #364153;
          }
        }

        span {
          font-size: 1.6rem;
          color: #99A1AF;

          &:last-child {
            position: absolute;
            left: 50%;
            bottom: 0;
            width: max-content;
            font-size: 1.4rem;
            transform: translateX(-50%);
            color: #99A1AF;
          }
        }
      }

      b {
        width: 18rem;
        margin: 1rem 1rem 0;
        border-bottom: 1px dashed #6a7282;
      }
    }

    .content {
      margin: 6rem 0 0;
      p {
        margin: 0 0 1.2rem;
        font-size: 1.4rem;
        line-height: 2.2rem;
        color: #6A7282;

        &:last-child {
          margin: 0;
        }
      }
    }

    .reset-btn-box {
      margin: 2.4rem 0 0;

      .reset-back {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48rem;
        height: 4.8rem;
        margin: 1.4rem 0 0;
        font-size: 1.6rem;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background: #F5F5F5;
        color: #6A7282;
        cursor: pointer;

        &:hover{
          color: #FB64B6;
        }
      }

      .reset-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48rem;
        height: 4.8rem;
        font-size: 1.6rem;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background: #FB64B6;
        color: #ffffff;
        cursor: pointer;

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
  }
}
</style>
