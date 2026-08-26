<template>
  <div class="reset-page">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="auth-single">
      <div class="auth-card">
        <div class="check-circle">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22A06B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>

        <h1>{{ t("header.reset.title") }}</h1>

        <div class="info-block">
          <p>{{ t("header.reset.info1") }}</p>
          <p>{{ t("header.reset.info2") }}</p>
        </div>

        <button class="auth-submit active" @click="confirmReset()">
          {{ t("header.reset.login") }}
        </button>

        <span class="resend-link" @click="backReset()">{{ t("header.reset.resend") }} →</span>
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
.reset-page {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
  padding-top: 80px;

  .auth-single {
    max-width: 520px;
    margin: 32px auto 32px;
    padding: 0 28px;
  }

  .auth-card {
    border: 1px solid #2c2c2c;
    border-radius: 20px;
    background: #1a1a1a;
    padding: 44px 46px 38px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 18px 45px rgba(0,0,0,0.45);

    h1 {
      font-size: 27px;
      font-weight: 400;
      color: #f5f5f5;
      margin: 0 0 22px;
    }
  }

  .check-circle {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 50%;
    border: 1px solid #3d3d3d;
    background: #1a1a1a;
    display: grid;
    place-items: center;
    box-shadow: none;
  }

  .info-block {
    width: 100%;
    margin: 0 0 22px;

    p {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.7;
      color: #aaa;

      &:last-child {
        margin: 0;
      }
    }
  }

  .auth-submit {
    width: 100%;
    border: 2px solid #ff9aca;
    border-radius: 18px;
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    cursor: pointer;
    box-shadow: 0 0 23px rgba(255,50,140,0.65);
    transition: filter 0.15s;

    &:hover {
      filter: brightness(1.08);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .resend-link {
    margin-top: 16px;
    font-size: 13px;
    font-weight: 700;
    color: #aaa;
    cursor: pointer;

    &:hover {
      color: #ff4f9a;
    }
  }
}

@media (max-width: 480px) {
  .reset-page {
    .auth-single {
      padding: 0 12px;
      margin: 16px auto 16px;
    }

    .auth-card {
      padding: 24px 20px 24px;

      h1 {
        font-size: 22px;
      }
    }

    .auth-input {
      padding: 11px 13px;
      font-size: 14px;
    }

    .auth-submit {
      padding: 13px;
      font-size: 15px;
    }
  }
}
</style>
