<template>
  <div class="user-personal-edit">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.personal.title") }}</div>
          </div>
          <div class="panel-id">ID:{{ userInfo.info?.id || "" }}</div>
          <div class="content">
            <div class="section">
              <div class="label">
                <span>*</span>{{ t("user.personal.username")
                }}<b class="count">{{ nickname.length }}/18</b>
              </div>
              <input
                class="input-text"
                v-model="nickname"
                maxlength="18"
                :placeholder="t('user.personal.usernameText')"
                spellcheck="false"
              />
            </div>

            <div class="section">
              <div class="label-row">
                <div class="label"><span>*</span>{{ t("user.personal.avatar") }}</div>
              </div>
              <div class="avatar-wrap">
                <img class="avatar-img" :src="avatarUrl" alt="" />

                <div class="reupload-box">
                  <button class="reupload" @click="pickAvatar">{{ t("submit.reupload") }}</button>
                  <input
                    ref="avatarInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden-file"
                    title=""
                    @change="onAvatarPicked"
                  />
                </div>
              </div>
            </div>

            <div class="section">
              <div class="label"><span>*</span>{{ t("birthday.label") }}</div>

              <BirthPicker v-model="dateValue" @change="handleDateChange" />
            </div>

            <div class="actions">
              <button class="btn btn-cancel" @click="onCancel">
                {{ t("user.interactive.cancel") }}
              </button>
              <button class="btn btn-save" :disabled="saving" @click="onSave">
                {{ t("user.profile.save") }}
              </button>
            </div>
          </div>

          <div class="sensitive-row" v-if="userRegion">
            <div class="switch-box">
              <div class="label" :class="{ disabled: !isAdult }">
                {{ t("user.personal.sensitive") }}
              </div>

              <div
                class="switch"
                :class="{ on: showSensitive, disabled: !isAdult }"
                @click="onToggleSensitive"
              ></div>
            </div>

            <div class="tip">{{ t("user.personal.sensitiveTip") }}</div>
          </div>
        </div>
      </div>
    </div>

    <UploadMask :visible="isUploading" />
  </div>
</template>

<script setup lang="ts" name="UserPersonalEdit">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import BirthPicker from "@/components/BirthPicker.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

import { baseUrl } from "@/util/config";
import { toast } from "@/util/toast";
import router from "@/router";
import api from "@/api/index";

interface InfoData {
  id?: string;
  nickname?: string;
  avatar?: string;
  age_range?: string;
  birthday?: string;
  show_nsfw?: string;
}
interface UserData {
  user_id?: number;
  info?: InfoData;
}

const sidebarKey = ref("personal");
const userInfo = ref<UserData>({});
const nickname = ref("");
const age = ref("");
const avatarUrl = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const showSensitive = ref(false);
const isUploading = ref(false);

const initialValues = ref<{
  nickname: string;
  avatar: string;
  birthday: string;
}>({
  nickname: "",
  avatar: "",
  birthday: "",
});

const userRegion = ref(false);

const dateValue = ref<{ year: number | ""; month: number | ""; day: number | "" }>({
  year: "",
  month: "",
  day: "",
});

const isAdult = ref(false);

function onToggleSensitive() {
  if (!isAdult.value) return;

  showSensitive.value = !showSensitive.value;

  api.modifySensitive({
    show_nsfw: showSensitive.value ? 1 : 0,
  })
    .then((res: any) => {
      if (res.code !== 200 && res.code !== 0) {
        showSensitive.value = !showSensitive.value;
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      } else {
        toast('success');

        if (userInfo.value && userInfo.value.info) {
          userInfo.value.info.show_nsfw = showSensitive.value ? '1' : '0';
        }
      }
    })
    .catch((error: any) => {
      showSensitive.value = !showSensitive.value;
      toast(String(error));
    });
}

onMounted(async () => {
  getCountry();

  try {
    const res = (await api.userInfo()) as unknown as { code: number; data: UserData, timestamp: number };
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      userInfo.value = data;
      nickname.value = data.info?.nickname || "";
      age.value = data.info?.age_range || "";
      avatarUrl.value = data.info?.avatar || "";
      showSensitive.value = data.info?.show_nsfw == '1';

      initialValues.value = {
        nickname: data.info?.nickname || "",
        avatar: data.info?.avatar || "",
        birthday: data.info?.birthday || "",
      };

      if (data.info?.birthday) {
        const parts = data.info.birthday.split("-");
        dateValue.value = {
          year: parts[0] ? Number(parts[0]) : "",
          month: parts[1] ? Number(parts[1]) : "",
          day: parts[2] ? Number(parts[2]) : "",
        };

        const { year, month, day } = dateValue.value;
        if (year && month && day) {
          const birth = new Date(Number(year), Number(month) - 1, Number(day));

          const now = res.timestamp ? new Date(res.timestamp * 1000) : new Date();
          let age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
          }
          isAdult.value = age >= 18;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
});

function getCountry() {
  api.getCode().then((res: any) => {
    if (res.code == 0) {
      if (res.data.countryCode != 'CN') {
        userRegion.value = true;
      } else {
        userRegion.value = false;
      }
    } else {
      console.log()
    }
  }).catch(err => {
    console.log(err);
  })
}

function pickAvatar() {
  avatarInputRef.value?.click();
}
function onAvatarPicked() {
  uploadFile(avatarInputRef.value, (url) => {
    avatarUrl.value = url;
  });
}

function uploadFile(input: HTMLInputElement | null, cb: (url: string) => void) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const file = input?.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast(t("submit.image.uploadFormatError"));
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast(t("submit.image.uploadTip"));
    return;
  }

  isUploading.value = true;

  const formData = new FormData();
  formData.append("file", file);
  const parma = { method: "POST", headers: { token }, body: formData };
  fetch(baseUrl + "user/uploadImage", parma)
    .then((r) => r.json())
    .then(
      (res: { code: number; data?: { url?: string } | string; url?: string; msg: string; msg_jp: string }) => {
        if (res.code === 0 || res.code === 200) {
          const url = (typeof res.data === "string" ? res.data : res.data?.url) || res.url;
          if (typeof url === "string") {
            cb(url);
            toast(t('success'));
          }
        } else {
          toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
        }
      },
    )
    .catch((e: unknown) => {
      toast(String(e));
    })
    .finally(() => {
      isUploading.value = false;
    });
}

function handleDateChange(value: { year: number | ""; month: number | ""; day: number | "" }) {
  dateValue.value = value;
}

function onCancel() {
  router.push("/user-personal");
}
function onSave() {
  saving.value = true;

  const buildBirthdayString = () => {
    const { year, month, day } = dateValue.value;
    if (!year || !month || !day) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const currentBirthday = buildBirthdayString();

  const hasNicknameChanged = nickname.value !== initialValues.value.nickname;
  const hasAvatarChanged = avatarUrl.value !== initialValues.value.avatar;
  const hasBirthdayChanged = currentBirthday !== initialValues.value.birthday;

  const operations: Array<() => Promise<void>> = [];

  if (hasNicknameChanged) {
    operations.push(() => {
      return api.modifyUsername({ nickname: nickname.value })
        .then((res: any) => {
          if (res.code !== 200 && res.code !== 0) {
            throw new Error(res.msg);
          }
        });
    });
  }

  if (hasAvatarChanged) {
    operations.push(() => {
      return api.modifyAvatar({ avatar: avatarUrl.value })
        .then((res: any) => {
          if (res.code !== 200 && res.code !== 0) {
            throw new Error(res.msg);
          }
        });
    });
  }

  if (hasBirthdayChanged && currentBirthday) {
    operations.push(() => {
      return api.modifyBirth({
        year: dateValue.value.year,
        month: dateValue.value.month,
        day: dateValue.value.day
      })
        .then((res: any) => {
          if (res.code !== 200 && res.code !== 0) {
            throw new Error(res.msg);
          }
        });
    });
  }

  if (operations.length === 0) {
    saving.value = false;
    router.push("/user-personal");
    return;
  }

  let completedOperations = 0;
  let hasError = false;

  operations.forEach(operation => {
    operation()
      .catch((error: any) => {
        hasError = true;
        toast(error.message);
      })
      .finally(() => {
        completedOperations++;

        if (completedOperations === operations.length) {
          saving.value = false;

          if (!hasError) {
            toast(t('success'));
            router.push("/user-personal");
          }
        }
      });
  });
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  width: 40rem;
  background: #fff;
  border-radius: 1.2rem;
  overflow: hidden;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.6rem 2.4rem;
    border-bottom: 1px solid #f2f4f7;

    .title {
      font-size: 1.6rem;
      font-weight: 600;
      color: #101828;
    }
    .close-btn {
      width: 2rem;
      height: 2rem;
      cursor: pointer;
    }
  }

  .modal-body {
    padding: 2.4rem;

    .desc {
      font-size: 1.4rem;
      color: #344054;
      margin-bottom: 1.6rem;
      line-height: 1.5;
    }

    .dont-ask {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      cursor: pointer;

      .checkbox {
        width: 1.6rem;
        height: 1.6rem;
        img {
          width: 100%;
          height: 100%;
        }
      }
      span {
        font-size: 1.4rem;
        color: #667085;
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    padding: 1.6rem 2.4rem;
    border-top: 1px solid #f2f4f7;

    button {
      padding: 0.8rem 1.6rem;
      border-radius: 0.8rem;
      font-size: 1.4rem;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-cancel {
      border: 1px solid #d0d5dd;
      background: #fff;
      color: #344054;
    }
    .btn-confirm {
      border: none;
      background: #fb64b6;
      color: #fff;
    }
  }
}

.user-personal-edit {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(0deg, rgba(254, 251, 253, 0.5), rgba(254, 251, 253, 0.5)), #ffffff;
}
.container {
  max-width: 139.2rem;
  margin: 0 auto;
  display: flex;
  gap: 2.4rem;
}
.main {
  flex: 1;
  padding-top: 12rem;
}
.panel {
  min-height: calc(100vh - 14rem);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 1.2rem;
  padding: 2.4rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem 1.2rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}
.panel-id {
  margin: 0 0 1.2rem 1.2rem;
  font-size: 1.6rem;
  color: #fb64b6;
}

.content {
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: rgba(251, 100, 182, 0.04);

  .label {
    margin-bottom: 1.6rem;
    font-size: 1.4rem;
    color: #364153;
  }
  .label span {
    color: #fa2d47;
  }
  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .count {
    font-size: 1.2rem;
    color: #99a1af;
    font-weight: normal;
    margin-left: 1rem;
  }
}
.section {
  margin-bottom: 2.4rem;
}

.sensitive-row {
  margin: 2.4rem 1.2rem 0;

  .switch-box {
    display: flex;
    align-items: center;
    gap: 2.4rem;
    margin-bottom: 1.2rem;

    .label {
      color: #4a5565;
      &.disabled {
        color: #99a1af;
      }
    }
  }

  .switch {
    width: 4.4rem;
    height: 2.4rem;
    background: url("@/assets/images/user/close.png") no-repeat;
    background-size: 100% 100%;
    cursor: pointer;

    &.on {
      background: url("@/assets/images/user/open.png") no-repeat;
      background-size: 100% 100%;
    }

    &.disabled {
      cursor: not-allowed;
      background: url("@/assets/images/user/disable.png") no-repeat;
      background-size: 100% 100%;
    }
  }

  .tip {
    font-size: 1.2rem;
    color: #99a1af;
    line-height: 1.6rem;
  }
}
.avatar-wrap {
  display: flex;
  align-items: flex-end;
  gap: 1.6rem;
}
.avatar-img {
  width: 11.2rem;
  height: 11.2rem;
  border-radius: 0.8rem;
  object-fit: cover;
  border: 2px solid #fb64b6;
}
.reupload-box {
  position: relative;
  cursor: pointer;
}
.reupload {
  color: #00d3f2;
  font-size: 1.4rem;
  background: none;
  border: none;
  cursor: pointer;
}
.hidden-file {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 8rem;
  height: 3rem;
  opacity: 0;
  cursor: pointer;
  z-index: 5;
}

.input-text {
  width: 100%;
  height: 4.8rem;
  padding: 0 1.6rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  outline: none;
  color: #364153;
  font-size: 1.4rem;
  background: #fff;
}
.input-text:focus {
  border-color: #fb64b6;
}
.input-text::placeholder {
  color: #99a1af;
}

.age-options {
  display: flex;
  gap: 2.4rem;
  margin-top: 1.6rem;
}
.radio {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 1.4rem;
  color: #364153;
}
.hidden-radio {
  display: none;
}
.radio-circle {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 1px solid #fb64b6;
  position: relative;
}
.radio-circle.on::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 1rem;
  height: 1rem;
  background: #fb64b6;
  border-radius: 50%;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2.4rem;
}
.btn {
  height: 4.8rem;
  min-width: 13.6rem;
  padding: 0 1.6rem;
  border-radius: 0.8rem;
  cursor: pointer;
  font-size: 1.4rem;
  position: relative;
}
.btn-cancel {
  border: 1px solid #fb64b6;
  background: none;
  color: #fb64b6;
}
.btn-cancel:hover {
  background: rgba(251, 100, 182, 0.06);
  border-color: rgba(251, 100, 182, 0.35);
}
.btn-save {
  background: #fb64b6;
  border: none;
  color: #fff;
}
.btn-save:hover::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.2);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
