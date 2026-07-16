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

    h1 {
      font-size: 27px;
      font-weight: 400;
      color: #161122;
      margin: 0 0 5px;
    }

    .auth-sub {
      margin: 0 0 22px;
      font-size: 13.5px;
      font-weight: 600;
      line-height: 1.7;
      opacity: 0.55;
      color: #161122;
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
      color: #161122;
      letter-spacing: 0.02em;
    }
  }

  .auth-input {
    width: 100%;
    box-sizing: border-box;
    border: 2.5px solid #161122;
    border-radius: 12px;
    background: #fff;
    padding: 13px 15px;
    font-size: 15px;
    font-weight: 600;
    color: #161122;
    outline: none;
    transition: box-shadow 0.18s;

    &::placeholder {
      color: #bdb7c4;
    }

    &:focus {
      box-shadow: 3px 3px 0 rgba(255, 77, 141, 0.42);
    }
  }

  .auth-submit {
    border: 2.5px solid #161122;
    border-radius: 13px;
    background: rgba(255, 77, 141, 0.4);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    width: 100%;
    cursor: not-allowed;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s, background 0.2s;

    &.active {
      background: #FF4D8D;
      cursor: pointer;

      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
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
