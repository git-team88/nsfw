<template>
  <div class="exit-confirm-modal" v-if="visible">
    <div class="modal-content">
      <button class="close-btn" @click="closeModal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>
      <h3 class="modal-title">{{ t("user.personal.changeEmailTitle") }}</h3>
      <div class="modal-form">
        <div class="form-item">
          <div class="form-label">
            <span class="required-asterisk">*</span>{{ t("user.materialProvider.contactEmail") }}
          </div>
          <input type="email" class="form-input" v-model="emailForm.email" :placeholder="t('user.materialProvider.contactEmailPlaceholder')" />
        </div>
        <div class="form-item">
          <div class="form-label">
            <span class="required-asterisk">*</span>{{ t("user.personal.emailCode") }}
          </div>
          <div class="code-input-group">
            <input type="text" class="form-input code-input" v-model="emailForm.code" :placeholder="t('user.personal.codePlaceholder')" spallcheck="false" />
            <button type="button" class="send-code-btn" @click="sendEmailCode" :disabled="isSendCode" :class="{ 'disabled': isSendCode }">{{ emailCodeTxt }}</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-confirm-btn" @click="saveEmail" :disabled="!isFormValid">{{ t("user.personal.editConfirm") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="EmailEditModal">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import api from "@/api/index";
import { baseUrl, siteKey } from "@/util/config";

const { t, locale } = useI18n();

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const props = defineProps<{
  visible: boolean;
  currentEmail: string;
  kycId: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:email", email: string): void;
}>();

const emailForm = ref({
  email: "",
  code: "",
});

const isSendCode = ref(false);
const hasEverSentCode = ref(false);
const timer = ref<ReturnType<typeof setInterval> | null>(null);
const count = ref(60);
const isGrecaptchaReady = ref(false);
const recaptchaToken = ref("");

declare let grecaptcha: any;

declare global {
  interface Window {
    google: any;
  }
}

const emailCodeTxt = computed(() => {
  return hasEverSentCode.value ? t("register.resend") : t("user.personal.sendCode");
});

const isFormValid = computed(() => {
  return (
    emailForm.value.email &&
    emailForm.value.code
  );
});

onMounted(() => {
  checkGrecaptcha();
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

function timeCount() {
  timer.value = setInterval(() => {
    if (count.value <= 1) {
      clearInterval(timer.value!);
      timer.value = null;
      isSendCode.value = false;
      count.value = 60;
    } else {
      count.value -= 1;
    }
  }, 1000);
}

watch(() => props.visible, (val) => {
  if (val) {
    emailForm.value.email = props.currentEmail;
    emailForm.value.code = "";
    hasEverSentCode.value = false;
    isSendCode.value = false;
    count.value = 60;
  } else {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  }
});

function closeModal() {
  emit("close");
}

function sendEmailCode() {
  if (!emailForm.value.email) {
    toast(t("user.materialProvider.errorEmailFormat"));
    return;
  }

  if (!isGrecaptchaReady.value) {
    toast(t("grecaptcha.notLoaded"));
    return;
  }

  isSendCode.value = true;
  hasEverSentCode.value = true;

  grecaptcha
    .execute(siteKey, { action: "submit" })
    .then(function (token: any) {
      if (token) {
        recaptchaToken.value = token;

        const formData = new FormData();
        formData.append("email", emailForm.value.email);
        formData.append("g-recaptcha-response", token);
        formData.append("siteKey", siteKey);

        const userToken = localStorage.getItem("token") || "";
        const { ts, sign } = window.AntiCrawler.generateAuthParams(userToken);

        fetch(baseUrl + "user/sendKycEmailCode", {
          method: "post",
          headers: {
            "token": userToken,
            "ts": ts,
            "Platform": "web",
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
              toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
              isSendCode.value = false;
            }
          })
          .catch((error) => {
            console.error("Fail:", error);
            isSendCode.value = false;
          });
      } else {
        toast(t("fail"));
        isSendCode.value = false;
      }
    })
    .catch(() => {
      toast(t("fail"));
      isSendCode.value = false;
    });
}

function saveEmail() {
  if (!emailForm.value.email || !EMAIL_RE.test(emailForm.value.email)) {
    toast(t("user.materialProvider.errorEmailFormat"));
    return;
  }
  if (!emailForm.value.code) {
    toast(t("user.materialProvider.errorRequired", { field: t("user.personal.emailCode") }));
    return;
  }
  if (!props.kycId) {
    toast(t("fail"));
    return;
  }

  if (!recaptchaToken.value) {
    toast(t("grecaptcha.notLoaded"));
    return;
  }

  const formData = new FormData();
  formData.append("email", emailForm.value.email);
  formData.append("code", emailForm.value.code);
  formData.append("g-recaptcha-response", recaptchaToken.value);
  formData.append("siteKey", siteKey);
  formData.append("id", props.kycId);

  const userToken = localStorage.getItem("token") || "";
  const { ts, sign } = window.AntiCrawler.generateAuthParams(userToken);

  fetch(baseUrl + "user/modifyKycEmail", {
    method: "post",
    headers: {
      "token": userToken,
      "ts": ts,
      "Platform": "web",
      "sign": sign
    },
    body: formData,
  })
    .then((response) => response.json())
    .then((res) => {
      if (res.code == 0) {
        emit("update:email", emailForm.value.email);
        toast(t("success"));
        closeModal();
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
      }
    })
    .catch((error) => {
      console.error("Fail:", error);
      toast(t("fail"));
    });
}
</script>

<style scoped lang="scss">
.exit-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(22, 17, 34, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background: #FFFDF7;
    border: 3px solid #161122;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.16);
    border-radius: 12px;
    padding: 0 0 18px;

    .close-btn {
      background: none;
      border: none;
      padding: 0;
      position: absolute;
      top: 20px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .modal-title {
      padding: 18px 24px;
      border-bottom: 1px solid rgba(22, 17, 34, 0.12);
      font-size: 16px;
      font-weight: 600;
      color: #161122;
    }

    .modal-form {
      margin-bottom: 18px;
      padding: 18px 32px;
      border-bottom: 1px solid rgba(22, 17, 34, 0.12);
    }

    .form-item {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #5b5566;
    }

    .required-asterisk {
      color: #E5484D;
    }

    .form-input {
      width: 100%;
      height: 50px;
      padding: 12px 16px;
      border: 1px solid rgba(22, 17, 34, 0.12);
      border-radius: 8px;
      font-size: 14px;
      color: #161122;
      outline: none;
      background: rgba(22, 17, 34, 0.06);
      box-sizing: border-box;

      &:focus {
        border-color: #FF4D8D;
      }

      &::placeholder {
        color: #9a93a4;
      }
    }

    .code-input-group {
      display: flex;
      padding-right: 20px;
      border-radius: 8px;
      gap: 10px;
      background: rgba(22, 17, 34, 0.06);

      .code-input {
        flex: 1;
        height: 50px;
        padding: 12px 16px;
        font-size: 14px;
        color: #161122;
        outline: none;
        border: none;
        background: transparent;
      }
    }

    .send-code-btn {
      font-size: 14px;
      background: none;
      color: #FF4D8D;
      cursor: pointer;
      border: none;

      &:disabled {
        color: #9a93a4;
        cursor: not-allowed;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;

      .modal-confirm-btn {
        min-width: 240px;
        height: 48px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        border: none;
        background: #FF4D8D;
        color: #FFFFFF;

        &:disabled {
          background: rgba(251, 100, 182, 0.5);
          cursor: not-allowed;
        }

        &:hover:not(:disabled) {
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
}
</style>
