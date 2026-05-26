<template>
  <div class="modal-mask" v-if="visible">
    <div class="modal">
      <img src="@/assets/images/base/close.png" class="close-btn" @click="close" />
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
      <div class="skip-btn" @click="skip">{{ t("userInfo.skip") }} →</div>
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

  const parma = { method: "POST", headers: { token, ...authHeaders }, body: formData };

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
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 510;
}
.modal {
  width: 52rem;
  background: #ffffff;
  border-radius: 1.2rem;
  padding: 1.8rem 0;
  position: relative;
}
.close-btn {
  position: absolute;
  right: 2rem;
  top: 2rem;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}
.title {
  font-size: 1.6rem;
  font-weight: 500;
  color: #364153;
  margin-bottom: 1.8rem;
  margin-left: 1.8rem;
}

.container {
  margin-bottom: 1.8rem;
  padding: 1.8rem 3.2rem;
  border-top: 1px solid #F5F5F5;;
  border-bottom: 1px solid #F5F5F5;;
}
.form-item {
  margin-bottom: 1.8rem;
}
.form-item:last-child {
  margin-bottom: 0;
}
.label {
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  color: #4a5565;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;

  .birthday-tip {
    font-size: 1.2rem;
    color: #99A1AF;
    font-weight: normal;
  }
}
.count {
  font-size: 1.2rem;
  color: #99a1af;
}

.ipt {
  display: flex;
  align-items: center;
  width: 100%;
  height: 5rem;
  border: 1px solid #F5F5F5;
  border-radius: 0.8rem;
  padding: 1rem 1.2rem;
  font-size: 1.4rem;
  background: #F5F5F5;
  color: #101828;
  outline: none;
}
.ipt:focus {
  border-color: #fb64b6;
}
.ipt::placeholder {
  color: #99a1af;
}

.avatar-box {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}
.avatar-img {
  width: 8rem;
  height: 8rem;
  border-radius: 0.8rem;
  object-fit: cover;
}
.upload-btn {
  font-size: 1.4rem;
  color: #fb64b6;
  cursor: pointer;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24rem;
  height: 4.8rem;
  margin: 0 auto;
  background: #fb64b6;
  border-radius: 0.8rem;
  color: #ffffff;
  font-size: 1.4rem;
  border: none;
  cursor: pointer;

  &:hover:not(:disabled){
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
  position: relative;
  cursor: not-allowed;
}
.skip-btn {
  text-align: center;
  margin-top: 1.6rem;
  color: #99a1af;
  font-size: 1.4rem;
  cursor: pointer;
}
</style>
