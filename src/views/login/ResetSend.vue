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
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

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
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;

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
        padding: 0 0 3rem;

        &.on {
          span {
            color: #fb64b6;
          }
        }

        span {
          font-size: 1.6rem;
          color: #4a5565;

          &:last-child {
            position: absolute;
            left: 50%;
            bottom: 0;
            width: max-content;
            font-size: 1.4rem;
            transform: translateX(-50%);
            color: #6a7282;
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
        color: #364153;

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
        border: 1px solid #fb64b6;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        color: #fb64b6;
        cursor: pointer;
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
        background:
          linear-gradient(45deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%), rgba(255, 255, 255, 0.2);
        color: #ffffff;
        cursor: pointer;
      }
    }
  }
}
</style>
