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
    toast("Grecaptcha not loaded yet completed");
    return false;
  }

  grecaptcha
    .execute("6LdALkssAAAAAAB9dLSGTM-vNEyMAMEXLEfi-UhF", { action: "register" })
    .then(function (token: any) {
      if (token) {
        const data = {
          email: email.value,
          "g-recaptcha-response": token,
        };

        api
          .resetSendEmail(data)
          .then((res: any) => {
            if (res.code == 0) {
              localStorage.removeItem("lEmail");
              router.push("/reset-send");
            } else {
              toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
            }
          })
          .catch((err: any) => {
            console.log(err);
          });
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
      margin: 21rem 0 0;
      .email-title {
        font-size: 1.4rem;
        color: #4a5565;
      }
      .email-info {
        position: relative;
        width: 100%;
        margin: 0.7rem 0 2.4rem;

        .email-ipt {
          position: relative;
          width: 100%;
          height: 4.4rem;
          padding: 1rem;
          font: {
            weight: normal;
            size: 1.4rem;
          }
          border: 1px solid #fccee8;
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          background: rgba(255, 255, 255, 0.9);
          color: #101828;

          &::placeholder {
            font: {
              weight: 300;
              size: 1.2rem;
            }
            color: rgba(255, 255, 255, 0.5);
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
        width: 18rem;
        height: 4.8rem;
        margin: 0 auto;
        font: {
          size: 1.6rem;
        }
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background:
          linear-gradient(45deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%), rgba(255, 255, 255, 0.2);
        color: #ffffff;
        opacity: 0.7;
        cursor: default;

        &.on {
          opacity: 1;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
