<template>
  <div class="login">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="container">
      <div class="title">{{ t("header.login") }}</div>
      <div class="no-register">
        {{ t("header.noRegister") }}<span @click="goRegister()">{{ t("header.goRegister") }}</span>
      </div>

      <div>
        <div class="info">
          <form id="emailForm">
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
                  autocomplete="false"
                  @blur="handleEmailVerify"
                />
              </div>
              <div class="email-error" v-if="emailError">{{ emailError }}</div>
            </div>

            <div class="email-item-box">
              <div class="email-item-title">
                <span>*</span>{{ t("register.passwordLabel") }}
              </div>
              <div class="email-item">
                <input
                  id="password"
                  class="email-ipt"
                  :type="isShowPassword ? 'text' : 'password'"
                  v-model="password"
                  :placeholder="t('register.password')"
                  maxlength="20"
                  spellcheck="false"
                  autocomplete="false"
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

              <p class="forget-tip" @click="goForget()">
                <span>{{ t("register.forgetLabel") }}</span>
              </p>
            </div>
          </form>

          <div class="email-btn" :class="isEnd ? 'on' : ''" @click="goEmailLogin()">
            {{ t("header.login") }}
          </div>
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
            <span v-html="t('register.loginTip')"></span>
            <b>{{ t("register.terms") }}</b>
            {{ t("register.infix") }}
            <b>{{ t("register.privacy") }}</b>
            {{ t("register.tipEnd") }}
          </div>

          <div class="tip-text" v-else>
            <span v-html="t('register.loginTip')"></span>
            <b>{{ t("register.terms") }}</b>
            {{ t("register.infix") }}
            <b>{{ t("register.privacy") }}</b>
          </div>
        </div>
      </div>
    </div>

    <UploadMask v-if="isShowLoad" :visible="isShowLoad" :text="t('loading')" />
  </div>
</template>

<script setup lang="ts" name="Register">
import Header from "@/components/Header.vue";
import UploadMask from "@/components/UploadMask.vue";

import { computed, onMounted, ref, watch } from "vue";
import { baseUrl, redirectUrl } from "@/util/config";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import { initLanguage } from "@/util/utils";
import api from "@/api/index";
import router from "@/router";
import { trackLogin } from "@/utils/analytics";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

const email = ref("");
const isShowPassword = ref(false);
const password = ref("");
const emailError = ref("");
const passwordError = ref("");

const isShowLoad = ref(false);

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
  // 初始化语言设置
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
  if (headerRef.value) {
    headerRef.value.goRegister();
  }
  // router.push({
  //   path: "/register",
  // });
}

function goForget() {
  // 保存当前输入的邮箱到缓存
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

function goLink() {
  localStorage.setItem("isBack", "1");
}

function validatePassword(password: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,20}$/u;
  return regex.test(password);
}

function goEmailLogin() {
  if (!isEnd.value) {
    return false;
  }

  const data = {
    email: email.value,
    password: password.value,
  };

  api
    .emailLogin(data)
    .then((res: any) => {
      if (res.code == 0) {
        localStorage.setItem("token", res.data.token);
        trackLogin();

        if (headerRef.value) {
          headerRef.value.getLoginUserInfo()
        }

        router.push("/");
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    })
    .catch((err: any) => {
      console.log(err);
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
        trackLogin();

        // if (res.data && res.data.is_first == 1) {
        //   localStorage.setItem("isFirstLogin", "1");
        // }

        if (headerRef.value) {
          headerRef.value.getLoginUserInfo()
        }

        router.push("/");
      } else if (res.code == 10110) {
        if (headerRef.value) {
          headerRef.value.goRegister();
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
.login {
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

    .no-register {
      margin: 1rem 0 4rem;
      font-size: 1.6rem;
      text-align: center;
      color: #6a7282;

      span {
        color: #fb64b6;
        cursor: pointer;

        &:hover{
          text-decoration: underline;
        }
      }
    }

    .info {
      .email-item-box {
        margin: 0 0 2.4rem;
        .email-item-title-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .email-item-title {
          font-size: 1.4rem;
          color: #6A7282;
          span {
            color: #FA2D47;
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
            border: 1px solid #F5F5F5;
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
        }

        .email-error {
          margin-top: 0.4rem;
          font: {
            weight: 300;
            size: 1.2rem;
          }
          color: #fa2d47;
        }

        .forget-tip {
          margin: 1.2rem 0 0;
          font: {
            size: 1.4rem;
          }
          text-align: right;
          color: #fb64b6;
          cursor: pointer;

          span{
            &:hover{
              text-decoration: underline;
            }
          }
        }
      }

      .email-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 4.8rem;
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
            height: 4.8rem;
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
}
</style>
