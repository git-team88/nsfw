<template>
  <div class="register-page">
    <Header ref="headerRef" :cur="-1"></Header>
    <div class="auth-grid">
      <div class="auth-brand">
        <div class="brand-glow" aria-hidden="true"></div>
        <div class="brand-dots" aria-hidden="true"></div>
        <span class="brand-badge">{{ t("auth.register.badge") }}</span>
        <div class="brand-textblock">
          <h2>{{ t("auth.register.brandTitle") }}</h2>
          <p class="brand-copy">{{ t("auth.register.brandCopy") }}</p>
        </div>
        <div class="brand-perks">
          <span>{{ t("auth.register.perk1") }}</span>
          <span>{{ t("auth.register.perk2") }}</span>
        </div>
      </div>

      <div class="auth-card">
        <h1>{{ t("header.register") }}</h1>
        <p class="auth-sub">{{ t("auth.register.sub") }}</p>

        <div class="auth-field">
          <button type="button" class="oauth-btn" @click="showGoogle()">
            <img src="@/assets/images/register/google.png" alt="Google" />
            <span>{{ t("register.google") }}</span>
          </button>
        </div>

        <div class="auth-divider">
          <span>{{ t("register.or") }}</span>
        </div>

        <form id="emailForm" @submit.prevent="handleSubmit">
          <div class="auth-field">
            <label><span class="required">*</span> {{ t("register.emailLabel") }}</label>
            <input
              id="email"
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
            <label><span class="required">*</span> {{ t("register.passwordLabel") }}</label>
            <div class="password-row">
              <input
                id="password"
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
          </div>

          <div class="auth-field">
            <label><span class="required">*</span> {{ t("register.codeLabel") }}</label>
            <div class="input-row">
              <input
                id="code"
                class="auth-input code-input"
                type="text"
                v-model="code"
                :placeholder="t('register.code')"
                spellcheck="false"
                autocomplete="off"
                @blur="handleCodeVerify"
              />
              <button
                class="send-btn"
                :class="isSend ? 'disabled' : ''"
                type="submit"
                :disabled="isSend"
              >
                {{ emailTxt }}
              </button>
            </div>
            <span
              class="auth-hint"
              :class="codeError == t('register.spamTip') ? 'auth-hint-ok' : 'auth-hint-ng'"
              v-if="codeError"
            >{{ codeError }}</span>
          </div>

          <div class="auth-field">
            <label>{{ t("inviteCode.title") }} <span class="optional">{{ t("inviteCode.optional") }}</span></label>
            <input
              id="inviteCode"
              class="auth-input"
              type="text"
              v-model="inviteCode"
              :placeholder="t('inviteCode.enterCode')"
              spellcheck="false"
              autocomplete="off"
            />
          </div>
        </form>

        <button
          class="auth-submit"
          :class="isEnd ? 'active' : ''"
          :disabled="isLoading"
          type="button"
          @click="goEmailRegister()"
        >
          {{ t("header.register") }}
          <span class="btn-spinner" v-if="isLoading"></span>
        </button>

        <p class="auth-foot">
          {{ t("register.haveAccount") }}
          <a class="auth-link" @click="goLogin()">{{ t("register.toLogin") }}</a>
        </p>

        <div class="auth-tip">
          <span v-if="locale == 'jp'" v-html="t('register.tipInfo')"></span>
          <span v-else v-html="t('register.tipInfo')"></span>
          <span class="auth-terms">{{ t("register.terms") }}</span>
          {{ t("register.infix") }}
          <span class="auth-terms">{{ t("register.privacy") }}</span>
          <template v-if="locale == 'jp'"> {{ t("register.tipEnd") }}</template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <InviteCodeModal
        :visible="showInviteCodeModal"
        :initial-code="inviteCode"
        @close="showInviteCodeModal = false"
        @confirm="handleInviteCodeConfirm"
        @skip="handleInviteCodeSkip"
      />
    </Teleport>

    <div class="load" v-if="isShowLoad">
      <img src="@/assets/images/base/load.png" alt="" />
      <p>{{ t("wait") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts" name="Register">
import Header from "@/components/Header.vue";
import InviteCodeModal from "@/components/InviteCodeModal.vue";

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { baseUrl, redirectUrl, siteKey } from "@/util/config";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { initLanguage } from "@/util/utils";
import api from "@/api/index";
import router from "@/router";
import { trackSignUp } from "@/utils/analytics";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const email = ref("");
const emailToken = ref("");
const isSend = ref(false);
const isShowPassword = ref(false);
const password = ref("");
const code = ref("");
const inviteCode = ref("");
const emailError = ref("");
const passwordError = ref("");
const codeError = ref("");

const isShowLoad = ref(false);
const isLoading = ref(false);
const showBirthday = ref(false);
const showInviteCodeModal = ref(false);

const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const count = ref(60);
const isGrecaptchaReady = ref(false);
const hasEverSent = ref(false);

const emailTxt = computed(() => {
  return hasEverSent.value ? t("register.resend") : t("register.send");
});

const isEnd = computed(() => {
  if (email.value.length >= 2 && password.value.length >= 4 && code.value.length >= 2) {
    return true;
  } else {
    return false;
  }
});

declare let grecaptcha: any;

declare global {
  interface Window {
    google: any;
  }
}

function setSeoMeta() {
  document.title = t('seo.signup.title');
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', t('seo.signup.keywords'));
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', t('seo.signup.description'));
}

onMounted(async () => {
  await initLanguage();

  setSeoMeta();

  checkGrecaptcha();

  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get("from");
  if (fromParam) {
    inviteCode.value = fromParam;
  }

  const token = localStorage.getItem("token");
  const type = localStorage.getItem("rType");

  if (!token && type == "1") {
    googleRegister();
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

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});

function checkGrecaptcha() {
  if (typeof grecaptcha !== "undefined" && grecaptcha.ready) {
    isGrecaptchaReady.value = true;
  } else {
    setTimeout(checkGrecaptcha, 3000);
  }
}

function initGoogle() {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function showGoogle() {
  showInviteCodeModal.value = true;
}

function handleInviteCodeConfirm(code: string) {
  showInviteCodeModal.value = false;
  localStorage.setItem('inviteCode', code);
  redirectToGoogle();
}

function handleInviteCodeSkip() {
  showInviteCodeModal.value = false;
  localStorage.removeItem('inviteCode');
  redirectToGoogle();
}

function redirectToGoogle() {
  isShowLoad.value = true;
  const client_id = "258005297451-ovuch80d9h3t7mesfu7sgrdb3rntcbeu.apps.googleusercontent.com";
  const redirect_uri = redirectUrl + "/register";

  window.location.href =
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=" +
    client_id +
    "&redirect_uri=" +
    redirect_uri +
    "&response_type=code&scope=openid email profile&access_type=offline";

  localStorage.setItem("rType", "1");

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
    password.value.length < 6 ||
    password.value.length > 20 ||
    !validatePassword(password.value)
  ) {
    passwordError.value = t("register.passwordError");
  } else {
    passwordError.value = "";
  }
}

function handleCodeVerify() {
  if (!code.value) {
    codeError.value = t("register.code");
  } else {
    codeError.value = "";
  }
}

function handleSubmit() {
  if (isSend.value) {
    return false;
  }

  if (!email.value) {
    emailError.value = t("register.email");
    return false;
  }

  if (!isGrecaptchaReady.value) {
    toast(t("grecaptcha.notLoaded"));
    return false;
  }

  isSend.value = true;
  hasEverSent.value = true;

  const data = {
    type: "email",
    identifier: email.value,
  };

  api
    .checkRegister(data)
    .then((res: any) => {
      if (res.code == 0) {
        if (res.data.isReg == 0) {
          grecaptcha
            .execute(siteKey, { action: "submit" })
            .then(function (token: any) {
              if (token) {
                emailToken.value = token;

                const formData = new FormData();
                formData.append("email", email.value);
                formData.append("g-recaptcha-response", token);
                formData.append("siteKey", siteKey);

                const userToken = localStorage.getItem("token") || "";
                const { ts, sign } = window.AntiCrawler.generateAuthParams(userToken);

                fetch(baseUrl + "login/sendEmailVerifyCode", {
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
                      timeCount();
                      codeError.value = t('register.spamTip');
                    } else {
                      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
                      isSend.value = false;
                    }
                  })
                  .catch((error) => console.error("Fail:", error));
              } else {
                toast(t("fail"));
                isSend.value = false;
              }
            })
            .catch(() => {
              toast(t("fail"));
              isSend.value = false;
            });
        } else {
          toast(t("register.hasRegister"));
          isSend.value = false;
        }
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
        isSend.value = false;
      }
    })
    .catch((err: any) => {
      console.log(err);
      isSend.value = false;
    });
}

function timeCount() {
  timer.value = setInterval(() => {
    if (count.value <= 1) {
      clearInterval(timer.value!);
      timer.value = null;
      isSend.value = false;
      count.value = 60;
    } else {
      count.value -= 1;
    }
  }, 1000);
}

function validatePassword(password: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/u;
  return regex.test(password);
}

function goLogin() {
  router.push("/login");
}

// 注册/登录成功后，若有来源作品详情页地址则回跳，否则回首页
function redirectAfterAuth() {
  // 首次注册：若未登录时自声明满18岁（本地缓存 is_adult=1），注册成功后补调 user/setAdult
  if (localStorage.getItem("is_adult") === "1") {
    api.setAdult({ is_adult: 1 }).catch(() => {});
  }
  // 清除未登录时的本地成年声明，年龄状态以后端 is_adult 为准
  localStorage.removeItem("pendingSetAdult");
  localStorage.removeItem("is_adult");
  const redirect = localStorage.getItem("loginRedirect");
  localStorage.removeItem("loginRedirect");
  router.push(redirect || "/");
}

function goEmailRegister() {
  if (!isEnd.value || isLoading.value) {
    return false;
  }

  if (!email.value) {
    emailError.value = t("register.email");
    return false;
  }

  if (
    !password.value ||
    password.value.length < 6 ||
    password.value.length > 20 ||
    !validatePassword(password.value)
  ) {
    passwordError.value = t("register.passwordError");
    return false;
  }

  if (!code.value) {
    codeError.value = t("register.code");
    return false;
  }

  isLoading.value = true;

  const emailData = {
      email: email.value,
      password: password.value,
      code: code.value,
      invite_code: inviteCode.value,
      "g-recaptcha-response": emailToken.value,
      channel: 1,
  };

    api
      .emailRegister(emailData)
      .then((res: any) => {
        if (res.code == 0) {
          showBirthday.value = false;
          trackSignUp();

          localStorage.setItem("token", res.data.token);
          localStorage.setItem("isFirstRegister", "1");
          redirectAfterAuth();
        } else {
          showBirthday.value = false;
          toast(locale.value == "jp" ? res.msg_jp : res.msg);
        }
      })
      .catch((err: any) => {
        showBirthday.value = false;
        toast(t('fail'));
      })
      .finally(() => {
        isLoading.value = false;
      });
}

function googleRegister() {
  const urlParams = new URLSearchParams(window.location.search);
  const googleCode = urlParams.get("code");
  const invite_code = localStorage.getItem("inviteCode");

  if (!googleCode) {
    isShowLoad.value = false;
    localStorage.removeItem("rType");
    localStorage.removeItem("inviteCode");
    return false;
  }

  isShowLoad.value = true;

  const googleData = {
    code: googleCode,
    invite_code: invite_code,
    channel: 1,
  };

  api
    .googleRegister(googleData)
    .then((res: any) => {
      if (res.code == 0) {
        isShowLoad.value = false;
        localStorage.setItem("token", res.data.token);
        localStorage.removeItem("rType");
        localStorage.removeItem('inviteCode');
        trackSignUp();

        localStorage.setItem("isFirstRegister", "1");
        redirectAfterAuth();
      } else {
        isShowLoad.value = false;
        localStorage.removeItem("rType");
        localStorage.removeItem('inviteCode');
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    })
    .catch((err: any) => {
      isShowLoad.value = false;
      localStorage.removeItem("rType");
      localStorage.removeItem('inviteCode');
      console.log(err);
      toast(t('fail'));
    });
}
</script>

<style lang="scss" scoped>
.register-page {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
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
    border: 1px solid #2c2c2c;
    border-radius: 20px;
    background: radial-gradient(circle at 90% 85%, rgba(255,50,140,.08), transparent 25%), linear-gradient(145deg, #202225, #17191c);
    padding: 52px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 620px;

    .brand-glow {
      display: none;
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
      display: none;
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
      background: #1a1a1a;
      color: #ff4f9a;
      padding: 7px 14px;
      border-radius: 999px;
      border: 1px solid #3d3d3d;
      width: fit-content;
    }

    .brand-textblock {
      position: relative;
      z-index: 1;

      h2 {
        font-size: 40px;
        font-weight: 400;
        line-height: 1.28;
        color: #f5f5f5;
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
      color: #aaa;
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
      color: #f5f5f5;
    }
  }

  .auth-card {
    border: 1px solid #2c2c2c;
    border-radius: 20px;
    background: #1a1a1a;
    box-shadow: 0 18px 45px rgba(0,0,0,0.45);
    min-width: 0;
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

      .required {
        color: #E5484D;
      }

      .optional {
        color: #777;
        font-weight: 600;
      }
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

  .input-row {
    display: flex;
    gap: 9px;
    align-items: stretch;

    .code-input {
      flex: 1;
      min-width: 0;
    }

    .send-btn {
      flex: none;
      box-sizing: border-box;
      border: 1px solid #3d3d3d;
      border-radius: 12px;
      background: #1a1a1a;
      color: #ddd;
      font-size: 13.5px;
      font-weight: 800;
      padding: 0 16px;
      cursor: pointer;
      box-shadow: none;
      white-space: nowrap;
      transition: border-color 0.15s;

      &:hover {
        border-color: #555;
      }

      &.disabled {
        color: #555;
        cursor: not-allowed;

        &:hover {
          border-color: #3d3d3d;
        }
      }
    }
  }

  .auth-hint {
    display: inline-block;
    min-height: 1px;
    font-size: 11.5px;
    font-weight: 600;
    line-height: 1.5;
    opacity: 1;
    color: #777;

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
    color: #ff4f9a;
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
    border: 1px solid #3d3d3d;
    border-radius: 12px;
    background: #1a1a1a;
    padding: 13px;
    font-size: 14.5px;
    font-weight: 800;
    color: #ddd;
    cursor: pointer;
    box-shadow: none;
    transition: border-color 0.15s;

    &:hover {
      border-color: #555;
    }

    &:active {
      border-color: #555;
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
    color: #555;
    font-size: 12px;
    font-weight: 700;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 2px;
      background: #2c2c2c;
    }
  }

  .auth-submit {
    border: 2px solid #ff9aca;
    border-radius: 18px;
    background: linear-gradient(145deg, #ff65ab, #f02c80);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 15px;
    width: 100%;
    cursor: pointer;
    box-shadow: 0 0 23px rgba(255,50,140,0.65);
    transition: filter 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:not(.active) {
      opacity: 0.5;
      cursor: not-allowed;

      &:hover {
        filter: none;
      }
    }

    &.active {
      &:hover {
        filter: brightness(1.08);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    &:disabled {
      cursor: not-allowed;

      &:hover {
        filter: none;
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

  .auth-tip {
    margin: 16px 0 0;
    font-size: 12px;
    text-align: center;
    color: #777;
    line-height: 1.6;
  }

  .auth-foot {
    margin: 20px 0 0;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    color: #888;
  }

  .auth-terms {
    color: #ff4f9a;
    font-weight: 800;
    cursor: default;
  }

  .load {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    z-index: 800;
    img {
      width: 32px;
      height: 32px;
      animation: rotate 2s linear infinite;
    }
    p {
      margin: 20px 0 0;
      font-size: 18px;
      font-weight: 500;
      color: #ffffff;
    }
  }
}

@media (max-width: 900px) {
  .register-page {
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
  .register-page {
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

    .send-btn {
      padding: 0 12px;
      font-size: 12px;
    }
  }
}
</style>
