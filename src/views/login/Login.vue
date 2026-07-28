<template>
  <div class="login-page">
    <Header ref="headerRef" :cur="-1"></Header>
    <div class="auth-grid">
      <div class="auth-brand">
        <div class="brand-glow" aria-hidden="true"></div>
        <div class="brand-dots" aria-hidden="true"></div>
        <span class="brand-badge">{{ t("auth.login.badge") }}</span>
        <div class="brand-textblock">
          <h2>{{ t("auth.login.brandTitle") }}</h2>
          <p class="brand-copy">{{ t("auth.login.brandCopy") }}</p>
        </div>
        <div class="brand-perks">
        </div>
      </div>

      <div class="auth-card">
        <h1>{{ t("header.login") }}</h1>
        <p class="auth-sub">{{ t("auth.login.sub") }}</p>

        <div class="auth-field">
          <button type="button" class="oauth-btn" @click="showGoogle()">
            <img src="@/assets/images/register/google.png" alt="Google" />
            <span>{{ t("register.google") }}</span>
          </button>
        </div>

        <div class="auth-divider">
          <span>{{ t("register.or") }}</span>
        </div>

        <div class="auth-field">
          <label>{{ t("register.emailLabel") }}</label>
          <input
            class="auth-input"
            type="text"
            v-model="email"
            :placeholder="t('register.email')"
            spellcheck="false"
            autocomplete="off"
            @blur="handleEmailVerify"
          />
          <span class="auth-hint auth-hint-ng" v-if="emailError">{{ emailError }}</span>
        </div>

        <div class="auth-field">
          <label>{{ t("register.passwordLabel") }}</label>
          <div class="password-row">
            <input
              class="auth-input"
              :type="isShowPassword ? 'text' : 'password'"
              v-model="password"
              :placeholder="t('register.password')"
              maxlength="20"
              spellcheck="false"
              autocomplete="off"
              @blur="handlePasswordVerify"
            />
            <button
              type="button"
              class="password-toggle"
              @click="isShowPassword = !isShowPassword"
              v-if="password && password.length > 0"
            >
              <img src="@/assets/images/register/eye.png" v-if="isShowPassword" />
              <img src="@/assets/images/register/close.png" v-else />
            </button>
          </div>
          <span class="auth-hint auth-hint-ng" v-if="passwordError">{{ passwordError }}</span>
          <span class="auth-hint" style="text-align: right; display: block;">
            <a class="auth-link" @click="goForget()">{{ t("register.forgetLabel") }}</a>
          </span>
        </div>

        <button
          class="auth-submit"
          :class="isEnd ? 'active' : ''"
          :disabled="isLoading"
          type="button"
          @click="goEmailLogin()"
        >
          {{ t("header.login") }}
          <span class="btn-spinner" v-if="isLoading"></span>
        </button>

        <p class="auth-foot">
          {{ t("header.noRegister") }}
          <a class="auth-link" @click="goRegister()">{{ t("header.goRegister") }}</a>
        </p>

        <div class="auth-tip">
          <span v-if="locale == 'jp'" v-html="t('register.loginTip')"></span>
          <span v-else v-html="t('register.loginTip')"></span>
          <span class="auth-terms">{{ t("register.terms") }}</span>
          {{ t("register.infix") }}
          <span class="auth-terms">{{ t("register.privacy") }}</span>
          <template v-if="locale == 'jp'"> {{ t("register.tipEnd") }}</template>
        </div>
      </div>
    </div>

    <UploadMask v-if="isShowLoad" :visible="isShowLoad" :text="t('loading')" />

    <Agree ref="agreeRef" @toRegister="goRegister"></Agree>
  </div>
</template>

<script setup lang="ts" name="Login">
import Header from "@/components/Header.vue";
import Agree from "@/components/Agree.vue";
import UploadMask from "@/components/UploadMask.vue";

import { computed, onMounted, ref, watch } from "vue";
import { baseUrl, redirectUrl } from "@/util/config";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { initLanguage } from "@/util/utils";
import api from "@/api/index";
import router from "@/router";
import { trackLogin, setUserId } from "@/utils/analytics";

const { t, locale } = useI18n();

const agreeRef = ref<InstanceType<typeof Agree> | null>(null);
const headerRef = ref<InstanceType<typeof Header> | null>(null);

const email = ref("");
const isShowPassword = ref(false);
const password = ref("");
const emailError = ref("");
const passwordError = ref("");

const isShowLoad = ref(false);
const isLoading = ref(false);

const isEnd = computed(() => {
  if (email.value.length >= 2 && password.value.length >= 6) {
    return true;
  } else {
    return false;
  }
});

declare global {
  interface Window {
    google: any;
  }
}

function setSeoMeta() {
  document.title = t('seo.login.title');
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.login.keywords'));
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.login.description'));
}

onMounted(async () => {
  await initLanguage();

  setSeoMeta();

  const token = localStorage.getItem("token");
  const type = localStorage.getItem("lType");

  if (type && type == "1") {
    googleLogin();
  }

  if (token) {
    router.push("/");
  } else {
    initGoogle();
  }
});

watch(() => locale.value, () => {
  setSeoMeta();
});

function goRegister() {
  if (agreeRef.value) {
    agreeRef.value.showAgree();
  }
}

function goForget() {
  if (email.value) {
    localStorage.setItem("lEmail", email.value);
  }

  router.push({
    path: "/reset-password",
  });
}

function initGoogle() {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function showGoogle() {
  isShowLoad.value = true;
  localStorage.setItem("lType", "1");

  const client_id = "258005297451-ovuch80d9h3t7mesfu7sgrdb3rntcbeu.apps.googleusercontent.com";
  const redirect_uri = redirectUrl + "/login";
  window.location.href =
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=" +
    client_id +
    "&redirect_uri=" +
    redirect_uri +
    "&response_type=code&scope=openid email profile&access_type=offline";

  setTimeout(() => {
    isShowLoad.value = false;
  }, 1000);
}

function handleEmailVerify() {
  if (!email.value) {
    emailError.value = t("register.email");
  } else {
    emailError.value = "";
  }
}

function handlePasswordVerify() {
  if (
    !password.value ||
    password.value.length < 8 ||
    password.value.length > 20 ||
    !validatePassword(password.value)
  ) {
    passwordError.value = t("register.passwordError");
  } else {
    passwordError.value = "";
  }
}

function validatePassword(password: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,20}$/u;
  return regex.test(password);
}

// 登录成功后，若有来源作品详情页地址则回跳，否则回首页
function redirectAfterAuth() {
  // 登录成功后清除未登录时的本地成年声明，年龄状态以后端 is_adult 为准（登录不补调 setAdult）
  localStorage.removeItem("pendingSetAdult");
  localStorage.removeItem("is_adult");
  const redirect = localStorage.getItem("loginRedirect");
  localStorage.removeItem("loginRedirect");
  router.push(redirect || "/");
}

function goEmailLogin() {
  if (!isEnd.value || isLoading.value) {
    return false;
  }

  isLoading.value = true;

  const data = {
    email: email.value,
    password: password.value,
  };

  api
    .emailLogin(data)
    .then((res: any) => {
      if (res.code == 0) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("uid", res.data.user_id);
        setUserId(String(res.data.user_id));
        trackLogin();

        redirectAfterAuth();
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    })
    .catch((err: any) => {
      console.log(err);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

function googleLogin() {
  const urlParams = new URLSearchParams(window.location.search);

  const googleCode = urlParams.get("code");

  if (!googleCode) {
    isShowLoad.value = false;
    localStorage.removeItem("lType");
    return false;
  }

  const googleData = {
    code: googleCode,
    from_m: 0,
  };

  api
    .googleLogin(googleData)
    .then((res: any) => {
      if (res.code == 0) {
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("lType");
        localStorage.setItem("uid", res.data.user_id);
        setUserId(String(res.data.user_id));
        trackLogin();

        redirectAfterAuth();
      } else if (res.code == 10110) {
        if (agreeRef.value) {
          agreeRef.value.showAgree();
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)

        localStorage.removeItem("lType");
      }
    })
    .catch((err: any) => {
      console.log(err);

      localStorage.removeItem("lType");
    });
}
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  background: #FFFBF4;
  padding-top: 80px;

  .auth-grid {
    display: grid;
    grid-template-columns: 1.02fr 1fr;
    gap: 8px;
    width: 100%;
    max-width: 1320px;
    margin: 0 auto 32px;
    padding: 0 28px;
    align-items: stretch;
  }

  .auth-brand {
    position: relative;
    overflow: hidden;
    min-width: 0;
    border: 3px solid #161122;
    border-radius: 6px;
    background: radial-gradient(ellipse 96% 92% at 28% 18%, #FFF6D6 0%, #FFE885 26%, #FFD23F 52%, #FF9E45 76%, #FF7AAE 100%);
    padding: 52px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 620px;

    .brand-glow {
      position: absolute;
      width: 280px;
      height: 280px;
      left: -50px;
      top: -70px;
      z-index: 0;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.65), transparent 70%);
      filter: blur(6px);
      opacity: 0.8;
      pointer-events: none;
    }

    .brand-dots {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image: radial-gradient(rgba(22, 17, 34, 0.16) 1.4px, transparent 1.4px);
      background-size: 15px 15px;
      -webkit-mask-image: linear-gradient(150deg, #000, transparent 66%);
      mask-image: linear-gradient(150deg, #000, transparent 66%);
    }

    .brand-badge {
      position: relative;
      z-index: 1;
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.14em;
      background: #161122;
      color: #FFD23F;
      padding: 7px 14px;
      border-radius: 999px;
      width: fit-content;
    }

    .brand-textblock {
      position: relative;
      z-index: 1;

      h2 {
        font-size: 40px;
        font-weight: 400;
        line-height: 1.28;
        color: #161122;
        margin: 0;
        letter-spacing: 0.01em;
        white-space: pre-line;
      }
    }

    .brand-copy {
      margin: 16px 0 0;
      font-size: 14.5px;
      font-weight: 700;
      line-height: 1.9;
      color: #161122;
      opacity: 0.72;
      max-width: 320px;
    }

    .brand-perks {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12.5px;
      font-weight: 800;
      color: #161122;
      opacity: 0.75;
    }
  }

  .auth-card {
    border: 3px solid #161122;
    border-radius: 6px;
    background: #FFFDF7;
    min-width: 0;
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

  .password-row {
    position: relative;

    .auth-input {
      width: 100%;
      padding-right: 44px;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 20px;
        height: 20px;
      }
    }
  }

  .auth-hint {
    display: inline-block;
    min-height: 1px;
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.5;
    opacity: 0.55;
    color: #161122;

    &.auth-hint-ng {
      color: #E5484D;
      opacity: 1;
      font-weight: 800;
    }

    &.auth-hint-ok {
      color: #22A06B;
      opacity: 1;
      font-weight: 800;
    }
  }

  .auth-link {
    color: #FF4D8D;
    font-weight: 800;
    cursor: pointer;
    text-decoration: none;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font-size: inherit;

    &:hover {
      text-decoration: underline;
    }
  }

  .oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    width: 100%;
    box-sizing: border-box;
    border: 2.5px solid #161122;
    border-radius: 12px;
    background: #fff;
    padding: 13px;
    font-size: 14.5px;
    font-weight: 800;
    color: #161122;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.16s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 4px 5px 0 #161122;
    }

    &:active {
      transform: translateY(0);
      box-shadow: 2px 2px 0 #161122;
    }

    img {
      width: 20px;
      height: 20px;
    }
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    color: #bdb7c4;
    font-size: 12px;
    font-weight: 700;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 2px;
      background: rgba(22, 17, 34, 0.12);
    }
  }

  .auth-submit {
    border: 2.5px solid #161122;
    border-radius: 13px;
    background: #FF4D8D;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    width: 100%;
    cursor: pointer;
    box-shadow: 3px 3px 0 #161122;
    transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s, opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:not(.active) {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: 3px 3px 0 #161122;
      }
    }

    &.active {
      &:hover {
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 #161122;
      }

      &:active {
        transform: translate(0, 0);
        box-shadow: 2px 2px 0 #161122;
      }
    }

    &:disabled {
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: 3px 3px 0 #161122;
      }
    }

    .btn-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      margin-left: 8px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: rotate 1s linear infinite;
    }
  }

  .auth-foot {
    margin: 20px 0 0;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    opacity: 0.65;
    color: #161122;
  }

  .auth-tip {
    margin: 16px 0 0;
    font-size: 12px;
    text-align: center;
    color: #9a93a4;
    line-height: 1.6;
  }

  .auth-terms {
    color: #FF4D8D;
    font-weight: 800;
    cursor: default;
  }
}

@media (max-width: 900px) {
  .login-page {
    .auth-grid {
      grid-template-columns: 1fr;
      max-width: 520px;
      margin: 0 auto 20px;
      padding: 0 16px;
    }

    .auth-brand {
      min-height: 170px;
      padding: 32px 26px;

      .brand-textblock h2 {
        font-size: 30px;
      }
    }

    .auth-card {
      padding: 32px 24px 30px;
    }
  }
}

@media (max-width: 480px) {
  .login-page {
    .auth-grid {
      margin: 0 auto 16px;
      padding: 0 12px;
    }

    .auth-brand {
      padding: 24px 20px;
      min-height: 140px;

      .brand-textblock h2 {
        font-size: 24px;
      }

      .brand-copy {
        font-size: 13px;
      }
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

    .oauth-btn {
      padding: 11px;
      font-size: 13.5px;
    }
  }
}
</style>
