<template>
  <div class="exit-confirm-modal" v-if="visible">
    <div class="modal-content">
      <img class="close-btn" src="@/assets/images/base/close.png" alt="" @click="closeModal" />
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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50rem;
    background: #FFFFFF;
    border-radius: 1.2rem;
    padding: 0 0 1.8rem;

    .close-btn {
      position: absolute;
      top: 2rem;
      right: 1.2rem;
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }

    .modal-title {
      padding: 1.8rem 2.4rem;
      border-bottom: 1px solid #F5F5F5;
      font-size: 1.6rem;
      font-weight: 500;
      color: #364153;
    }

    .modal-form {
      margin-bottom: 1.8rem;
      padding: 1.8rem 3.2rem;
      border-bottom: 1px solid #F5F5F5;
    }

    .form-item {
      margin-bottom: 1.6rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.8rem;
      font-size: 1.4rem;
      color: #6A7282;
    }

    .required-asterisk {
      color: #FA2D47;
    }

    .form-input {
      width: 100%;
      height: 5rem;
      padding: 1.2rem 1.6rem;
      border: 1px solid #F5F5F5;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      color: #364153;
      outline: none;
      background: #F5F5F5;
      box-sizing: border-box;

      &:focus {
        border-color: #FB64B6;
      }

      &::placeholder {
        color: #99A1AF;
      }
    }

    .code-input-group {
      display: flex;
      padding-right: 2rem;
      border-radius: 0.8rem;
      gap: 1rem;
      background: #F5F5F5;

      .code-input {
        flex: 1;
        height: 5rem;
        padding: 1.2rem 1.6rem;
        font-size: 1.4rem;
        color: #364153;
        outline: none;
        border: none;
        background: transparent;
      }
    }

    .send-code-btn {
      font-size: 1.4rem;
      background: none;
      color: #FB64B6;
      cursor: pointer;
      border: none;

      &:disabled {
        color: #99A1AF;
        cursor: not-allowed;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: center;

      .modal-confirm-btn {
        min-width: 24rem;
        height: 4.8rem;
        border: none;
        border-radius: 0.8rem;
        font-size: 1.4rem;
        cursor: pointer;
        border: none;
        background: #FB64B6;
        color: #FFFFFF;

        &:disabled {
          background: rgba(251, 100, 182, 0.5);
          cursor: not-allowed;
        }

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
    }
  }
}
</style>