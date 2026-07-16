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
  background: #FFFBF4;
  padding-top: 80px;

  .auth-single {
    max-width: 520px;
    margin: 32px auto 32px;
    padding: 0 28px;
  }

  .auth-card {
    border: 3px solid #161122;
    border-radius: 6px;
    background: #FFFDF7;
    padding: 44px 46px 38px;
    display: flex;
    flex-direction: column;
    align-items: center;

    h1 {
      font-size: 27px;
      font-weight: 400;
      color: #161122;
      margin: 0 0 22px;
    }
  }

  .check-circle {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 50%;
    border: 3px solid #161122;
    background: #DFF5E9;
    display: grid;
    place-items: center;
    box-shadow: 3px 3px 0 #161122;
  }

  .info-block {
    width: 100%;
    margin: 0 0 22px;

    p {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.7;
      color: #5b5566;

      &:last-child {
        margin: 0;
      }
    }
  }

  .auth-submit {
    width: 100%;
    border: 2.5px solid #161122;
    border-radius: 13px;
    background: #FF4D8D;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 #161122;
    }

    &:active {
      transform: translate(0, 0);
      box-shadow: 2px 2px 0 #161122;
    }
  }

  .resend-link {
    margin-top: 16px;
    font-size: 13px;
    font-weight: 700;
    color: #161122;
    opacity: 0.55;
    cursor: pointer;

    &:hover {
      opacity: 1;
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
