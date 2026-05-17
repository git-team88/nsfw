<template>
  <div class="user-account">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.account.title") }}</div>
          </div>
          <div class="content">
            <div class="item">
              <div class="item-header">
                <div class="label">{{ t("user.account.email") }}</div>
                <div class="action-group" v-if="!loading">
                  <span
                    class="action-btn"
                    @click="handleEmailAction"
                    >{{ emailBind ? t("user.account.change") : t("user.account.link") }}</span
                  >
                  <span
                    class="unbind-btn"
                    v-if="emailBind && showUnbindButton"
                    @click="handleUnbind('email')"
                    >{{ t("user.account.unbind") }}</span
                  >
                </div>
              </div>
              <div class="value-box">
                <template v-if="!loading">{{
                  emailBind ? emailBind.identifier : t("user.account.notBound")
                }}</template>
              </div>
            </div>

            <div class="item">
              <div class="item-header">
                <div class="label">{{ t("user.account.google") }}</div>
                <div class="action-group" v-if="!loading">
                  <span class="action-btn" @click="changeGoogle">{{
                    googleBind ? t("user.account.change") : t("user.account.link")
                  }}</span>
                  <span
                    class="unbind-btn"
                    v-if="googleBind && showUnbindButton"
                    @click="handleUnbind('google')"
                    >{{ t("user.account.unbind") }}</span
                  >
                </div>
              </div>
              <div class="value-box">
                <template v-if="!loading">{{
                  googleBind ? googleBind.identifier : t("user.account.notBound")
                }}</template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-mask" v-if="showEmailModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">{{ t("user.account.changeEmail") }}</div>
          <img class="close-icon" :src="closeIcon" @click="closeEmailModal" alt="close" />
        </div>

        <form class="email-form" id="emailForm" @submit.prevent="handleSubmit">
          <div class="email-item-box">
            <div class="email-item-title">{{ t("register.emailLabel") }}</div>
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
            <div class="email-item-title">{{ t("register.passwordLabel") }}</div>
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
          </div>

          <div class="email-item-box">
            <div class="email-item-title-box">
              <div class="email-item-title">{{ t("register.codeLabel") }}</div>

              <div class="email-code-intro" v-if="isHoverCode">{{ t("register.sendIntro") }}</div>
            </div>

            <div class="email-item">
              <input
                id="code"
                class="email-code"
                type="text"
                v-model="code"
                :placeholder="t('register.code')"
                spellcheck="false"
                autocomplete="false"
                @blur="handleCodeVerify"
              />

              <button class="email-txt" :class="isSend ? 'on' : ''" type="submit">
                {{ emailTxt }}
              </button>
            </div>
            <div class="email-error" v-if="codeError">{{ codeError }}</div>
          </div>
        </form>

        <div>
          <button class="confirm-btn" :disabled="!canConfirm" @click="confirmEmailBind">
            {{ t("user.account.confirm") }}
          </button>
          <div class="tip">
            {{ t("user.account.tipPrefix") }}
            <a href="/privacy" target="_blank">{{ t("user.account.privacy") }}</a>
            {{ t("user.account.and") }}
            <a href="/terms" target="_blank">{{ t("user.account.terms") }}</a>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-mask" v-if="showUnbindModal">
      <div class="unbind-modal">
        <img class="unbind-icon" :src="closeIcon" @click="closeUnbindModal" alt="close" />
        <div class="unbind-body">
          <div class="unbind-title">{{ t("user.account.unbindConfirm") }}</div>
        </div>
        <div class="unbind-actions">
          <button class="cancel-btn" @click="closeUnbindModal">{{ t("cancel") }}</button>
          <button class="confirm-unbind-btn" @click="confirmUnbind">
            {{ t("user.account.unbind") }}
          </button>
        </div>
      </div>
    </div>

    <div class="load" v-if="isShowLoad">
      <img src="@/assets/images/base/load.png" alt="" />
      <p>{{ t("wait") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserAccount">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";

import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api/index";
import { toast } from "@/util/toast";
import router from "@/router";
import { baseUrl, redirectUrl, siteKey } from "@/util/config";
import closeIcon from "@/assets/images/base/close.png";

const { t, locale } = useI18n();
const sidebarKey = ref("account");
const isShowLoad = ref(false);

interface BindInfo {
  type: string;
  identifier: string;
  name: string;
  status: string;
}

interface UserData {
  user_id?: number;
  bind?: BindInfo[];
}

const userInfo = ref<UserData>({});
const loading = ref(true);
const showEmailModal = ref(false);
const showUnbindModal = ref(false);
const unbindType = ref<"email" | "google" | null>(null);
const email = ref("");
const emailToken = ref("");
const isHoverCode = ref(false);
const isSend = ref(false);
const isShowPassword = ref(false);
const password = ref("");
const code = ref("");
const emailError = ref("");
const passwordError = ref("");
const codeError = ref("");

const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const count = ref(60);
const isGrecaptchaReady = ref(false);
const hasEverSent = ref(false);

const emailTxt = computed(() => {
  return hasEverSent.value ? t("register.resend") : t("register.send");
});

const emailBind = computed(() => userInfo.value.bind?.find((b) => b.type == "email"));
const googleBind = computed(() => userInfo.value.bind?.find((b) => b.type == "google"));
const canConfirm = computed(
  () => email.value.length >= 2 && password.value.length >= 2 && code.value.length >= 2,
);
const showUnbindButton = computed(() => emailBind.value && googleBind.value);

declare let grecaptcha: any;

declare global {
  interface Window {
    google: any;
  }
}

onMounted(async () => {
  window.scrollTo(0, 0);

  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/");
    return false;
  }

  const type = localStorage.getItem("bType");
  if (type && type == "1") {
    handleGoogleBind();
  }

  checkGrecaptcha();
  getUserInfo();
});

async function getUserInfo() {
  try {
    const res = (await api.userInfo()) as unknown as { code: number; data: UserData };
    if (res.code === 0 || res.code === 200) {
      userInfo.value = res.data || {};
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function checkGrecaptcha() {
  if (typeof grecaptcha !== "undefined" && grecaptcha.ready && typeof grecaptcha.execute === "function") {
    isGrecaptchaReady.value = true;
  } else {
    setTimeout(checkGrecaptcha, 3000);
  }
}

function handleEmailAction() {
  email.value = "";
  code.value = "";
  showEmailModal.value = true;
}

function closeEmailModal() {
  emailError.value = "";
  passwordError.value = "";
  codeError.value = "";
  showEmailModal.value = false;
}

function handleEmailVerify() {
  if (!email.value) {
    emailError.value = t("register.email");
  } else {
    emailError.value = "";
  }
}

function validatePassword(password: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,20}$/u;
  return regex.test(password);
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

  if (typeof grecaptcha === "undefined" || typeof grecaptcha.execute !== "function") {
    toast(t("grecaptcha.notAble"));
    return false;
  }

  hasEverSent.value = true;
  isSend.value = true;

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
            "sign": sign
          },
          body: formData,
        })
          .then((response) => response.json())
          .then((res) => {
            if (res.code == 0) {
              toast(t("success"));
              timeCount();
            } else {
              toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
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
}

function timeCount() {
  timer.value = setInterval(() => {
    if (count.value <= 1) {
      clearInterval(timer.value!);
      timer.value = null;
      isSend.value = false;
      count.value = 60;
      // emailTxt 现在是 computed，会自动更新，所以不需要手动赋值
    } else {
      count.value -= 1;
      // emailTxt 现在是 computed，会自动更新为 count.value
    }
  }, 1000);
}

function confirmEmailBind() {
  api.bindEmail({ email: email.value, password: password.value, code: code.value, "g-recaptcha-response": emailToken.value }).then((res: any) => {
    const r = res as { code: number; msg: string };
    if (r.code === 0 || r.code === 200) {
      toast(t('success'));
      closeEmailModal();
      getUserInfo();
    } else {
      toast(r.msg);
    }
  });
}

function changeGoogle() {
  isShowLoad.value = true;
  localStorage.setItem("bType", "1");

  const client_id = "258005297451-ovuch80d9h3t7mesfu7sgrdb3rntcbeu.apps.googleusercontent.com";
  const redirect_uri = redirectUrl + "/user-account";
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

function handleGoogleBind() {
  const urlParams = new URLSearchParams(window.location.search);
  const googleCode = urlParams.get("code");

  if (!googleCode) {
    isShowLoad.value = false;
    localStorage.removeItem("bType");
    return false;
  }

  isShowLoad.value = true;
  const googleData = {
    code: googleCode
  };

  api
    .bindGoogle(googleData)
    .then((res: unknown) => {
      const r = res as any;
      if (r.code == 0 || r.code === 200) {
        toast(t('success'));
        getUserInfo();
        isShowLoad.value = false;
        localStorage.removeItem("bType");
      } else {
        toast(locale.value == 'jp' ?  r.msg_jp : r.msg)
        isShowLoad.value = false;
        localStorage.removeItem("bType");
      }
    })
    .catch((err: unknown) => {
      console.log(err);
      isShowLoad.value = false;
      localStorage.removeItem("bType");
    });
}

function handleUnbind(type: "email" | "google") {
  unbindType.value = type;
  showUnbindModal.value = true;
}

function closeUnbindModal() {
  showUnbindModal.value = false;
  unbindType.value = null;
}

function confirmUnbind() {
  if (!unbindType.value) return;

  isShowLoad.value = true;
  const apiCall = unbindType.value === "email" ? api.unbindEmail() : api.unbindGoogle();

  apiCall
    .then((res: unknown) => {
      const r = res as { code: number; msg?: string };
      if (r.code === 0 || r.code === 200) {
        toast(t("user.account.unbindSuccess"));
        getUserInfo();
        closeUnbindModal();
      } else {
        toast(r.msg || "Error");
      }
    })
    .catch((err: unknown) => {
      console.error(err);
      toast("Error");
    })
    .finally(() => {
      isShowLoad.value = false;
    });
}
</script>

<style scoped lang="scss">
.user-account {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 6rem;
  padding-right: 6rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem 0;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
}

.item {
  margin-bottom: 2.4rem;
}
.item:last-child {
  margin-bottom: 0;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6rem;
}
.label {
  font-size: 1.4rem;
  color: #99A1AF;
}
.action-group {
  display: flex;
  gap: 1.6rem;
  align-items: center;
}
.action-btn {
  font-size: 1.4rem;
  color: #fb64b6;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.action-btn:hover {
  text-decoration: underline;
}
.action-btn.on {
  color: #00d3f2;
}
.unbind-btn {
  font-size: 1.4rem;
  color: #99A1AF;
  cursor: pointer;
}
.unbind-btn:hover {
  text-decoration: underline;
}
.value-box {
  width: 100%;
  display: flex;
  align-items: center;
  color: #364153;
  font-weight: 500;
  font-size: 1.4rem;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
}
.modal {
  width: 52rem;
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 1.8rem 0;
  position: relative;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.8rem 1.8rem 2.4rem;
  border-bottom: 1px solid #F5F5F5;
}
.modal-title {
  font-weight: 500;
  font-size: 1.6rem;
  color: #101828;
}
.close-icon {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}
.email-form {
  padding: 1.8rem 3.2rem;
  border-bottom: 1px solid #F5F5F5;
}
.email-item-box {
  margin-bottom: 2rem;
  &:last-child {
    margin-bottom: 0;
  }
  .email-item-title-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .email-code-intro {
    position: absolute;
    right: 0;
    top: 2.6rem;
    padding: 0.6rem;
    font-size: 1.4rem;
    -webkit-border-radius: 0.4rem;
    border-radius: 0.4rem;
    background: rgba(16, 13, 48, 0.96);
    color: rgba(255, 255, 255, 0.7);
    z-index: 10;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: inherit;
      background:
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(51, 163, 255, 0.6) 50%,
          rgba(255, 255, 255, 0) 100%
        ),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(51, 163, 255, 0.6) 50%,
          rgba(255, 255, 255, 0) 100%
        );
      background-blend-mode: screen;
      z-index: -1;
      padding: 1px;
      -webkit-mask:
        linear-gradient(white 0 0) content-box,
        linear-gradient(white 0 0);
      mask:
        linear-gradient(white 0 0) content-box,
        linear-gradient(white 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
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

    .email-code {
      width: 100%;
      height: 4.4rem;
      padding: 1rem;
      font: {
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
  }
}
.input-group {
  margin-bottom: 2rem;
}
.input-group:last-child {
  margin-bottom: 0;
}
.input-label {
  font-size: 1.4rem;
  color: #4a5565;
  margin-bottom: 0.8rem;
}
.input-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 4.8rem;
  padding: 0 1rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  outline: none;
  font-size: 1.4rem;
  color: #364153;
}
.input-box.readonly {
  background: #f9fafb;
  color: #99a1af;
  display: flex;
  align-items: center;
}
.input-box:focus {
  border-color: #fb64b6;
}
.input-box::placeholder {
  color: #99a1af;
}
.code-wrap {
  position: relative;
}
.send-btn {
  position: absolute;
  right: 1.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: #fb64b6;
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
}
.send-btn:disabled {
  color: #99a1af;
  cursor: not-allowed;
}
.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24rem;
  height: 4.8rem;
  background: #FB64B6;
  border-radius: 0.8rem;
  color: #ffffff;
  font-size: 1.4rem;
  border: none;
  cursor: pointer;
  margin: 1.8rem auto 0;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    position: relative;
    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
  }
}
.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.tip {
  text-align: center;
  font-size: 1.2rem;
  color: #99A1AF;
  margin: 1.2rem 2.4rem 0;
}
.tip a {
  color: #fb64b6;
}
.tip a:hover {
  text-decoration: underline;
}

.unbind-modal {
  width: 50rem;
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 4.4rem 2rem 2.4rem;
  position: relative;
  text-align: center;
}

.unbind-icon {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}

.unbind-title {
  font-size: 1.4rem;
  line-height: 2rem;
  color: #364153;
  margin-bottom: 2.4rem;
}
.unbind-message {
  font-size: 1.4rem;
  color: #6a7282;
  word-break: break-all;
}
.unbind-actions {
  display: flex;
  gap: 2.4rem;
  justify-content: center;
}
.cancel-btn {
  min-width: 13.6rem;
  height: 4.8rem;
  background: #F5F5F5;
  border-radius: 0.8rem;
  color: #6A7282;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s;
}
.cancel-btn:hover {
  color: #FB64B6;
}
.confirm-unbind-btn {
  min-width: 13.6rem;
  height: 4.8rem;
  background: #fb64b6;
  border: none;
  border-radius: 0.8rem;
  color: #ffffff;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.3s;
}
.confirm-unbind-btn:hover {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.8rem;
    z-index: 5;
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
</style>
