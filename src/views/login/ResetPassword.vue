<template>
  <div class="reset">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="container">
      <div class="title">{{ t("header.reset.title") }}</div>

      <div class="step">
        <div class="step-item on">
          <span>{{ t("register.step1") }}</span>
          <span>{{ t("header.reset.btn") }}</span>
        </div>

        <b></b>
        <div class="step-item">
          <span>{{ t("register.step2") }}</span>
          <span>{{ t("header.reset.link") }}</span>
        </div>
      </div>

      <div class="content">
        <div class="email-title">{{ t("header.reset.tip") }}</div>

        <div class="email-info">
          <input
            id="email"
            class="email-ipt"
            type="text"
            v-model="email"
            :placeholder="t('register.email')"
            spellcheck="false"
            autocomplete="false"
          />
        </div>

        <div class="email-btn" :class="isEnd ? 'on' : ''" @click="goSendEmail()">
          {{ t("header.reset.btn") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="ResetPassword">
import api from "@/api";
import Header from "@/components/Header.vue";
import router from "@/router";
import { baseUrl, siteKey } from "@/util/config";
import { toast } from "@/util/toast";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const email = ref("");
const isGrecaptchaReady = ref(false);

const isEnd = computed(() => {
  if (email.value.length >= 1) {
    return true;
  } else {
    return false;
  }
});

declare let grecaptcha: any;

onMounted(() => {
  const token = localStorage.getItem("token");

  if (token) {
    router.push("/");
    return false;
  }

  const loginEmail = localStorage.getItem("lEmail");
  if (loginEmail) {
    email.value = loginEmail;
  }

  checkGrecaptcha();
});

function checkGrecaptcha() {
  if (typeof grecaptcha !== "undefined" && grecaptcha.ready) {
    isGrecaptchaReady.value = true;
  } else {
    setTimeout(checkGrecaptcha, 3000);
  }
}

function goSendEmail() {
  if (!isEnd.value) {
    return false;
  }

  if (!email.value) {
    toast(t("header.reset.tip"));
    return false;
  }

  if (!isGrecaptchaReady.value) {
    toast(t("grecaptcha.notLoaded"));
    return false;
  }

  grecaptcha
    .execute(siteKey, { action: "submit" })
    .then(function (token: any) {
      if (token) {
        const formData = new FormData();
        formData.append("email", email.value);
        formData.append("g-recaptcha-response", token);
        formData.append("siteKey", siteKey);

        const userToken = localStorage.getItem("token") || "";
        const { ts, sign } = window.AntiCrawler.generateAuthParams(userToken);

        fetch(baseUrl + "login/resetEmailPasswordReq", {
          method: "post",
          headers: {
            "ts": ts,
            "sign": sign
          },
          body: formData,
        })
          .then((response) => response.json())
          .then((res) => {
            if (res.code == 0) {
              toast(t("success"));
              localStorage.removeItem("lEmail");
              router.push("/reset-send");
            } else {
              toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
            }
          })
          .catch((error) => toast(t("fail")));
      } else {
        toast(t("fail"));
      }
    });
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
        size: 3rem;
      }
      text-align: center;
      color: #101828;
    }

    .step {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      margin: 4rem 0 6rem;

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
      .email-title {
        font-size: 1.4rem;
        color: #6A7282;
      }
      .email-info {
        position: relative;
        width: 100%;
        margin: 0.7rem 0 2.4rem;

        .email-ipt {
          position: relative;
          width: 100%;
          height: 5rem;
          padding: 1rem;
          font: {
            weight: normal;
            size: 1.4rem;
          }
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          background: #F5F5F5;
          color: #101828;

          &::placeholder {
            color: #99A1AF;
          }

          &:hover,
          &:focus {
            border: 1px solid #fb64b6;
          }
        }
      }

      .email-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 4.8rem;
        margin: 0 auto;
        font: {
          size: 1.6rem;
        }
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background: rgba(251, 100, 182, 0.5);
        color: #ffffff;
        cursor: default;

        &.on {
          background: #FB64B6;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
