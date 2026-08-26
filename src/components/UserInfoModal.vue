<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal">
      <button class="close-btn" @click="close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
      <div class="title">{{ t("userInfo.title") }}</div>

      <div class="container">
        <div class="form-item">
          <div class="label">
            {{ t("userInfo.username") }} <span class="count">{{ username.length }}/18 ({{ t('user.personal.usernameWarning') }})</span>
          </div>
          <input
            class="ipt"
            v-model="username"
            :placeholder="t('userInfo.usernamePlaceholder')"
            maxlength="18"
            spellcheck="false"
          />
        </div>

        <div class="form-item">
          <div class="label">{{ t("userInfo.avatar") }}</div>
          <div class="avatar-box">
            <img :src="avatar || defaultAvatar" class="avatar-img" />
            <div class="upload-btn" @click="triggerUpload">{{ t("userInfo.upload") }}</div>
            <input
              type="file"
              ref="fileInput"
              hidden
              accept="image/*"
              title=""
              @change="handleFile"
            />
          </div>
        </div>

        <div class="form-item">
          <div class="label">
            {{ t("birthday.label") }}
            <span class="birthday-tip">{{ t("user.personal.birthdayCannotEdit") }}</span>
          </div>

          <BirthPicker v-model="dateValue" @change="handleDateChange" />
        </div>
      </div>

      <button class="confirm-btn" @click="confirm">{{ t("userInfo.confirm") }}</button>
      <span class="skip-btn" @click="skip">{{ t("userInfo.skip") }} →</span>
    </div>
  </div>

  <UploadMask :visible="isUploading" />
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import defaultAvatar from "@/assets/images/base/avatar.png";
import { toast } from "@/util/toast";
import { baseUrl } from "@/util/config";
import UploadMask from "@/components/UploadMask.vue";
import BirthPicker from "./BirthPicker.vue";

const { t, locale } = useI18n();
const props = defineProps<{
  visible: boolean;
  userInfo?: any;
}>();
const emit = defineEmits(["close", "confirm", "skip"]);

const username = ref("");
const avatar = ref("");
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const dateValue = ref<{ year: number | ""; month: number | ""; day: number | "" }>({
  year: "",
  month: "",
  day: "",
});

const isValid = computed(() => {
  return dateValue.value.year && dateValue.value.month && dateValue.value.day;
});

function handleDateChange(value: { year: number | ""; month: number | ""; day: number | "" }) {
  dateValue.value = value;
}

watch(
  () => props.userInfo,
  (newInfo) => {
    if (newInfo) {
      username.value = newInfo.info?.nickname || "";
      avatar.value = newInfo.info?.avatar || defaultAvatar;
    }
  },
  { immediate: true },
);

function triggerUpload() {
  fileInput.value?.click();
}

function handleFile(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files && target.files[0];
  if (!file) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  if (!file.type.startsWith("image/")) {
    toast("Image format error");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast("Image too large");
    return;
  }

  isUploading.value = true;

  const formData = new FormData();
  formData.append("file", file);

  const authHeaders = window.AntiCrawler.generateAuthParams(token);

  const parma = { method: "POST", headers: { token, 'Platform': 'web', ...authHeaders }, body: formData };

  fetch(baseUrl + "user/uploadImage", parma)
    .then((r) => r.json())
    .then((res: any) => {
      if (res.code === 0 || res.code === 200) {
        const url = (typeof res.data === "string" ? res.data : res.data?.url) || res.url;
        if (typeof url === "string") avatar.value = url;
        toast(t('success'));
      } else {
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
      }
    })
    .catch((e) => {
      toast(String(e));
    })
    .finally(() => {
      isUploading.value = false;
    });
}

function confirm() {
  if (!username.value) {
    toast("Please enter username");
    return;
  }

  if (username.value.includes('#') || username.value.includes('@') || username.value.includes(' ')) {
    toast(t('user.personal.usernameWarning'));
    return;
  }

  const userData: any = {
    username: username.value,
    avatar: avatar.value
  };

  if (isValid.value) {
    userData.birth = {
      year: dateValue.value.year,
      month: dateValue.value.month,
      day: dateValue.value.day
    };
  }

  emit("confirm", userData);
}

function skip() {
  emit("skip");
}

function close() {
  emit("close");
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 510;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 510;
}

.modal {
  position: relative;
  z-index: 520;
  width: 520px;
  max-width: 90vw;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  padding: 32px 36px 28px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}

.modal-mask::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.close-btn {
  background: none;
  border: none;
  padding: 0;
  position: absolute;
  top: 14px;
  right: 16px;
  width: 28px;
  height: 28px;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background: #1a1a1a;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  padding: 0;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.title {
  font-size: 22px;
  font-weight: 800;
  color: #f5f5f5;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #2c2c2c;
}

.container {
  margin-bottom: 20px;
  padding: 20px 0;
  border-top: none;
  border-bottom: none;
}

.form-item {
  margin-bottom: 18px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: #f5f5f5;
  margin-bottom: 8px;
  letter-spacing: 0.02em;

  .birthday-tip {
    font-size: 12px;
    color: #777;
    font-weight: 600;
  }
}

.count {
  font-size: 12px;
  font-weight: 600;
  color: #777;
}

.ipt {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 13px 15px;
  font-size: 15px;
  font-weight: 600;
  background: #1a1a1a;
  color: #f5f5f5;
  outline: none;
  box-sizing: border-box;
  transition: box-shadow 0.18s;
}

.ipt:focus {
  box-shadow: 0 0 0 2px rgba(255, 79, 154, 0.42);
}

.ipt::placeholder {
  color: #777;
}

.avatar-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  border: 1px solid #3d3d3d;
  object-fit: cover;
  box-shadow: none;
}

.upload-btn {
  font-size: 14px;
  font-weight: 800;
  color: #ff4f9a;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.confirm-btn {
  width: 100%;
  border: 1px solid #3d3d3d;
  border-radius: 13px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
  padding: 14px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;

  &:hover {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }

  &:active {
    box-shadow: 0 0 20px rgba(255, 50,140, 0.5);
  }
}

.skip-btn {
  display: block;
  text-align: center;
  margin-top: 16px;
  color: #f5f5f5;
  opacity: 0.55;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
}
</style>