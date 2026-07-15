<template>
  <div class="register">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="container">
      <div class="title">{{ t("header.register") }}</div>
      <div class="free-computing">
        <div class="free-computing-inner">
          <img src="@/assets/images/register/gift.png" alt="" />
          <span>{{ t("register.freeComputing") }}</span>
        </div>
      </div>

      <div>
        <div class="info">
          <form id="emailForm" @submit.prevent="handleSubmit">
            <div class="email-item-box">
              <div class="email-item-title"><span>*</span>{{ t("register.emailLabel") }}</div>
              <div class="email-item">
                <input
                  id="email"
                  class="email-ipt"
                  type="text"
                  v-model="email"
                  :placeholder="t('register.email')"
                  spellcheck="false"
                  autocomplete="off"
                  @blur="handleEmailVerify"
                />
              </div>
              <div class="email-error" v-if="emailError">{{ emailError }}</div>
            </div>

            <div class="email-item-box">
              <div class="email-item-title"><span>*</span>{{ t("register.passwordLabel") }}</div>
              <div class="email-item">
                <input
                  id="password"
                  class="email-ipt"
                  :type="isShowPassword ? 'text' : 'password'"
                  v-model="password"
                  :placeholder="t('register.password')"
                  maxlength="20"
                  spellcheck="false"
                  autocomplete="off"
                  @blur="handlePasswordVerify"
                />

                <div
                  class="icon"
                  @click="isShowPassword = !isShowPassword"
                  v-if="password && password.length > 0"
                >
                  <img src="@/assets/images/register/eye.png" v-if="isShowPassword" />
                  <img src="@/assets/images/register/close.png" v-else />
                </div>
              </div>
              <div class="email-error" v-if="passwordError">{{ passwordError }}</div>
            </div>

            <div class="email-item-box">
              <div class="email-item-title-box">
                <div class="email-item-title"><span>*</span>{{ t("register.codeLabel") }}</div>
              </div>

              <div class="email-item">
                <input
                  id="code"
                  class="email-code"
                  type="text"
                  v-model="code"
                  :placeholder="t('register.code')"
                  spellcheck="false"
                  autocomplete="off"
                  @blur="handleCodeVerify"
                />

                <button class="email-txt" :class="isSend || !isGrecaptchaReady ? 'on' : ''" type="submit" :disabled="!isGrecaptchaReady">
                  {{ emailTxt }}
                </button>
              </div>
              <div class="email-error" :class="{ 'success': codeError == t('register.spamTip') }" v-if="codeError">{{ codeError }}</div>

              <div class="email-item-box" style="margin-top: 1.4rem;">
                <div class="email-item-title">{{ t("inviteCode.title") }}</div>
                <div class="email-item">
                  <input
                    id="inviteCode"
                    class="email-ipt"
                    type="text"
                    v-model="inviteCode"
                    :placeholder="t('inviteCode.enterCode')"
                    spellcheck="false"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>
            <button class="email-btn" :class="isEnd ? 'on' : ''" :disabled="isLoading" type="button" @click="goEmailRegister()">
              {{ t("header.register") }}
              <span class="btn-spinner" v-if="isLoading"></span>
            </button>
          </form>
        </div>

        <div class="other-login">
          <p class="other-login-title">
            <b></b>
            <span>{{ t("register.or") }}</span>
            <b></b>
          </p>

          <div class="icon-box">
            <div class="google-icon" @click="showGoogle()">
              <img src="@/assets/images/register/google.png" alt="" />
              <span>{{ t("register.google") }}</span>
            </div>
          </div>
        </div>

        <div class="tip">
          <div class="tip-text" v-if="locale == 'jp'">
            <span v-html="t('register.tipInfo')"></span>
            <b>{{ t("register.terms") }}</b>
            {{ t("register.infix") }}
            <b>{{ t("register.privacy") }}</b>
            {{ t("register.tipEnd") }}
          </div>

          <div class="tip-text" v-else>
            <span v-html="t('register.tipInfo')"></span>
            <b>{{ t("register.terms") }}</b>
            {{ t("register.infix") }}
            <b>{{ t("register.privacy") }}</b>
          </div>
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
  if (!isGrecaptchaReady.value) return t("grecaptcha.loading");
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
  // 初始化语言设置
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

function goLink() {
  localStorage.setItem("isBack", "1");
}

function validatePassword(password: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,20}$/u;
  return regex.test(password);
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
      "g-recaptcha-response": emailToken.value
  };

    api
      .emailRegister(emailData)
      .then((res: any) => {
        if (res.code == 0) {
          showBirthday.value = false;
          trackSignUp();

          if (headerRef.value) {
            headerRef.value.getLoginUserInfo()
          }

          localStorage.setItem("token", res.data.token);
          localStorage.setItem("isFirstRegister", "1");
          router.push("/");
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
    invite_code: invite_code
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
        router.push("/");
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
.register {
  width: 100%;
  min-height: 100vh;
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

    .free-computing {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1.2rem 0 2rem;

      .free-computing-inner{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1rem;
        background: linear-gradient(160deg, #FFFFFF 0%, #FFF3FA 52%, #FFE5F3 100%);
        border-radius: 1.4rem;
        border: 1px solid rgba(251, 100, 182, 0.3);
        font-size: 1.2rem;
        color: #FB64B6;

        img {
          width: 1.2rem;
          height: 1.2rem;
          margin-right: 0.4rem;
        }
      }
    }

    .step {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2rem 0 3rem;

      span {
        font-size: 1.8rem;
        color: rgba(255, 255, 255, 0.5);

        &.step-text {
          &.on {
            color: #33a3ff;
          }
        }

        &:nth-of-type(2) {
          position: relative;
          width: 18rem;
          margin: 0 1rem;
          border-bottom: 1px dashed transparent;
          &::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(
              90deg,
              rgba(51, 163, 255, 0.1),
              rgba(51, 163, 255, 0.5),
              rgba(51, 163, 255, 0.1)
            );
            -webkit-mask: repeating-linear-gradient(
              to right,
              #000 0,
              #000 4px,
              transparent 4px,
              transparent 8px
            );
            mask: repeating-linear-gradient(
              to right,
              #000 0,
              #000 4px,
              transparent 4px,
              transparent 8px
            );
          }
        }
      }
    }

    .info {
      .email-item-box {
        margin: 0 0 1.4rem;
        .email-item-title-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .email-item-title-intro{
          font-size: 1.4rem;
          color: #99A1AF;
          img{
            width: 1.6rem;
            cursor: pointer;
          }
        }

        .email-item-title {
          font-size: 1.4rem;
          color: #6A7282;
          span {
            color: #fa2d47;
          }
        }

        .email-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin: 1rem 0 0;

          .email-ipt {
            position: relative;
            width: 100%;
            height: 4.4rem;
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

          .icon {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 2.4rem;
            height: 2.4rem;
            cursor: pointer;

            img {
              width: 2.4rem;
              height: 2.4rem;
            }
          }

          .email-code {
            width: 100%;
            height: 4.4rem;
            padding: 1rem;
            font: {
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

          .email-txt {
            position: absolute;
            top: 0;
            right: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 4.4rem;
            font: {
              weight: 300;
              size: 1.4rem;
            }
            background: none;
            color: #fb64b6;
            cursor: pointer;
            &.on {
              color: #99A1AF;
              cursor: not-allowed;
            }
          }
        }

        .email-error {
          margin-top: 0.4rem;
          font: {
            weight: 300;
            size: 1.2rem;
          }
          color: #fa2d47;

          &.success {
            color: #99A1AF;
          }
        }
      }

      .email-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 4.8rem;
        border: none;
        outline: none;
        padding: 0;
        font: {
          size: 1.6rem;
        }
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background: rgba(251,100,182,0.5);
        color: #ffffff;
        cursor: default;

        &.on {
          background: #FB64B6;
          cursor: pointer;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.6;

          &:hover::after {
            content: none;
          }
        }

        .btn-spinner {
          display: inline-block;
          width: 2rem;
          height: 2rem;
          margin-left: 0.8rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: rotate 1s linear infinite;
        }

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

    .tip {
      margin: 2rem 0 0;
      font-size: 1.2rem;
      text-align: center;
      color: #99A1AF;

      b {
        font-weight: normal;
        color: #fb64b6;
      }
    }

    .other-login {
      margin: 2rem 0 0;

      .other-login-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 0 1.4rem;
        font-size: 1.4rem;
        color: #6A7282;

        b {
          width: 21.2rem;
          height: 1px;
          background: #F5F5F5;
        }
      }
      .icon-box {
        display: flex;
        align-items: center;
        justify-content: center;

        .google-icon {
          position: relative;
          width: 100%;
          height: 4.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-border-radius: 0.8rem;
          border-radius: 0.8rem;
          background: #F5F5F5;
          cursor: pointer;

          &:hover{
            span{
              color: #FB64B6;
            }
          }

          .g_id_signin {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 4。8rem;
            opacity: 0;
            overflow: hidden;
            z-index: 600;
          }
        }

        img {
          width: 3.2rem;
          height: 3.2rem;
          margin: 0 1rem 0 0;
          cursor: pointer;
        }

        span {
          font-size: 1.4rem;
          color: #6A7282;
        }
      }
    }
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
      width: 3.2rem;
      height: 3.2rem;
      animation: rotate 2s linear infinite;
    }
    p {
      margin: 2rem 0 0;
      font: {
        size: 1.8rem;
        weight: 500;
      }
      color: #ffffff;
    }
  }
}
</style>
