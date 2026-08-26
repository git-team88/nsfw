<template>
  <div class="reset-page">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="auth-single">
      <div class="auth-card">
        <h1>{{ t("header.reset.title") }}</h1>
        <p class="auth-sub">{{ t("header.reset.tip") }}</p>

        <div class="auth-field">
          <label>{{ t("register.emailLabel") }}</label>
          <input
            id="email"
            class="auth-input"
            type="text"
            v-model="email"
            :placeholder="t('register.email')"
            spellcheck="false"
            autocomplete="false"
          />
        </div>

        <button
          class="auth-submit"
          :class="isEnd ? 'active' : ''"
          @click="goSendEmail()"
        >
          {{ t("header.reset.btn") }}
        </button>
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
import { initLanguage } from "@/util/utils";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

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

onMounted(async () => {
  await initLanguage();

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
            "sign": sign,
            "Platform": "web"
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
              toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
    box-shadow: 0 18px 45px rgba(0,0,0,0.45);
    padding: 44px 46px 38px;
    display: flex;
    flex-direction: column;

    h1 {
      font-size: 27px;
      font-weight: 400;
      color: #f5f5f5;
      margin: 0 0 5px;
    }

    .auth-sub {
      margin: 0 0 22px;
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.7;
      color: #aaa;
    }
  }

  .auth-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 15px;

    label {
      font-size: 13px;
      font-weight: 800;
      color: #ddd;
      letter-spacing: 0.02em;
    }
  }

  .auth-input {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #3d3d3d;
    border-radius: 12px;
    background: #1a1a1a;
    padding: 13px 15px;
    font-size: 15px;
    font-weight: 600;
    color: #f5f5f5;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder {
      color: #555;
    }

    &:focus {
      border-color: #ff4f9a;
    }
  }

  .auth-submit {
    border: 2px solid #ff9aca;
    border-radius: 18px;
    background: rgba(255,50,140,0.3);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    width: 100%;
    cursor: not-allowed;
    box-shadow: 0 0 23px rgba(255,50,140,0.65);
    transition: filter 0.15s;

    &.active {
      background: linear-gradient(145deg, #ff65ab, #f02c80);
      cursor: pointer;

      &:hover {
        filter: brightness(1.08);
      }

      &:active {
        transform: scale(0.95);
      }
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
