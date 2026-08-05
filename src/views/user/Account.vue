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
                <div class="label-group">
                  <div class="label">{{ t("user.account.email") }}</div>
                  <div class="value" v-if="emailBind && !loading">{{ emailBind.identifier }}</div>
                  <div class="value" v-else-if="!loading">{{ t("user.account.notBound") }}</div>
                </div>
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
            </div>

            <div class="item">
              <div class="item-header">
                <div class="label-group">
                  <div class="label">{{ t("user.account.google") }}</div>
                  <div class="value" v-if="googleBind && !loading">{{ googleBind.identifier }}</div>
                  <div class="value" v-else-if="!loading">{{ t("user.account.notBound") }}</div>
                </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-mask" v-if="showEmailModal">
      <div class="modal">
        <button class="close-btn" @click="closeEmailModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
        <div class="modal-header">
          <div class="modal-title">{{ t("user.account.changeEmail") }}</div>
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

              <button class="email-txt" :class="isSend ? 'on' : ''" type="submit" :disabled="isSend">
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
        <button class="close-btn" @click="closeUnbindModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
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

import { ref, onMounted, computed, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api/index";
import { toast } from "@/util/toast";
import router from "@/router";
import { baseUrl, redirectUrl, siteKey } from "@/util/config";

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
    const res = (await api.userInfo()) as any;
    if (res.code === 0 || res.code === 200) {
      userInfo.value = res.data || {};
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
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
  const regex = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/u;
  return regex.test(password);
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
            } else {
              toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
              isSend.value = false;
            }
          })
          .catch((error) => {
            console.error("Fail:", error);
            isSend.value = false;
          });
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
  hasEverSent.value = true;
  count.value = 60;
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

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});

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
      const r = res as any;
      if (r.code === 0 || r.code === 200) {
        toast(t("user.account.unbindSuccess"));
        getUserInfo();
        closeUnbindModal();
      } else {
        toast(locale.value == 'en' ? r.msg : locale.value == 'zh' ? r.msg_cn : locale.value == 'tc' ? r.msg_tc : r.msg_jp);
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
  background: #FFFBF4;
}
.container {
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  gap: 18px;
  padding: 100px 30px 24px;
}
.main {
  flex: 1;
  padding: 24px;
  border: 3px solid #161122;
  border-radius: 14px;
  box-sizing: border-box;
  min-height: calc(100vh - 124px);
  margin-left: 238px;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}
.panel-title {
  font-weight: 800;
  font-size: 20px;
  color: #161122;
  position: relative;
  padding-bottom: 10px;
}
.panel-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 46px;
  height: 4px;
  border-radius: 2px;
  background: #FF4D8D;
}

.content {
  min-height: 380px;
}
.item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #fff;
  margin-bottom: 10px;
  box-shadow: 3px 3px 0 rgba(22,17,34,.10);
}
.item:last-child {
  margin-bottom: 0;
}
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 14px;
}
.label-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.label {
  font-weight: 800;
  font-size: 14px;
  color: #161122;
  white-space: nowrap;
}
.value {
  font-weight: 800;
  font-size: 14px;
  color: #161122;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.action-group {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-shrink: 0;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.action-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}
.unbind-btn {
  font-weight: 800;
  font-size: 14px;
  color: #E5484D;
  cursor: pointer;
}
.unbind-btn:hover {
  text-decoration: underline;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(22,17,34,.5);
}
.modal {
  width: min(520px, 94%);
  background: #FFFDF7;
  border: 2px solid #161122;
  border-radius: 18px;
  padding: 24px 26px;
}
.modal {
  position: relative;
}
.modal-header {
  margin: 0 0 10px;
}
.modal-title {
  font-weight: 800;
  font-size: 19px;
  color: #161122;
  margin: 0;
}
.close-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2.5px solid #161122;
  border-radius: 999px;
  background: #fff;
  box-shadow: 2px 2px 0 #161122;
  padding: 6px;
  transition: transform 0.16s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 10;

  &:hover { transform: scale(1.1) rotate(90deg); }
}
.close-btn:hover {
  transform: scale(1.1);
}
.email-form {
  padding: 18px 0;
}
.email-item-box {
  margin-bottom: 15px;
}
.email-item-box:last-child {
  margin-bottom: 0;
}
.email-item-title {
  font-weight: 800;
  font-size: 13px;
  color: #161122;
  letter-spacing: 0.02em;
}
.email-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin: 7px 0 0;
}
.email-ipt {
  width: 100%;
  box-sizing: border-box;
  height: 44px;
  padding: 13px 15px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #fff;
  font-weight: 600;
  font-size: 15px;
  color: #161122;
  outline: none;
  transition: box-shadow 0.18s;
}
.email-ipt:focus {
  box-shadow: 3px 3px 0 rgba(255,77,141,.42);
}
.email-ipt::placeholder {
  color: #bdb7c4;
}
.email-code {
  width: 100%;
  box-sizing: border-box;
  height: 44px;
  padding: 13px 15px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #fff;
  font-weight: 600;
  font-size: 15px;
  color: #161122;
  outline: none;
  transition: box-shadow 0.18s;
}
.email-code:focus {
  box-shadow: 3px 3px 0 rgba(255,77,141,.42);
}
.email-code::placeholder {
  color: #bdb7c4;
}
.email-txt {
  position: absolute;
  top: 0;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  background: none;
  color: #FF4D8D;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}
.email-txt.on {
  color: rgba(22,17,34,.55);
  cursor: not-allowed;
}
.email-error {
  font-weight: 800;
  font-size: 12px;
  color: #E5484D;
  margin-top: 4px;
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
  top: 26px;
  padding: 6px;
  font-size: 14px;
  border-radius: 4px;
  background: rgba(16, 13, 48, 0.96);
  color: rgba(255, 255, 255, 0.7);
  z-index: 10;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 13px 18px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  margin: 18px auto 0;
  min-width: 240px;
}
.confirm-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}
.confirm-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: 3px 3px 0 #161122;
}
.tip {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  color: #161122;
  margin: 12px 0 0;
}
.tip a {
  color: #FF4D8D;
}

.unbind-modal {
  width: min(440px, 94%);
  position: relative;
  background: #FFFDF7;
  border: 2px solid #161122;
  border-radius: 18px;
  padding: 24px 26px;
  text-align: center;
}
.unbind-title {
  font-weight: 800;
  font-size: 19px;
  color: #161122;
  margin: 0 0 20px;
}
.unbind-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.cancel-btn {
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #fff;
  color: #161122;
  font-weight: 800;
  font-size: 14px;
  padding: 13px 18px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  min-width: 136px;
}
.cancel-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}
.confirm-unbind-btn {
  border: 2.5px solid #161122;
  border-radius: 13px;
  background: #E5484D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 13px 18px;
  cursor: pointer;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  min-width: 136px;
}
.confirm-unbind-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}

.load {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(22,17,34,.4);
  z-index: 800;
}
.load img {
  width: 32px;
  height: 32px;
  animation: rotate 2s linear infinite;
}
.load p {
  margin: 20px 0 0;
  font-weight: 500;
  font-size: 18px;
  color: #ffffff;
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 30px 24px;
  }
  .main {
  padding: 24px;
  margin-left: 0;
  }
  .content {
    padding: 20px 16px;
  }
}
@media (max-width: 420px) {
  .content {
    padding: 16px 12px;
  }
  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .label-group {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
