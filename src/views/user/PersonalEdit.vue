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
          <!-- <div class="panel-id">ID:{{ userInfo.info?.id || "" }}</div> -->
          <div class="content">
            <div class="section">
              <div class="label">
                <span>*</span>{{ t("user.personal.username")
                }}<b class="count">{{ nickname.length }}/18 ({{ t('user.personal.usernameWarning') }})</b>
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
                  <button class="reupload" @click="pickAvatar">{{ t("submit.video.reupload") }}</button>
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
              <div class="label">
                <span>*</span>{{ t("birthday.label") }}
                <b class="birthday-tip">{{ t("user.personal.birthdayCannotEdit") }}</b>
              </div>

              <div v-if="hasBirthday" class="birth-box">
                {{ formatDatePart(dateValue.month) }}-{{ formatDatePart(dateValue.day) }}-{{ dateValue.year }}
              </div>
              <BirthPicker v-else v-model="dateValue" :isEdit="true" @change="handleDateChange" />
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

          <!-- <div class="sensitive-row" v-if="userRegion">
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
          </div> -->
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
import { ref, onMounted, computed } from "vue";
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

// Check if birthday exists initially from user info
const hasBirthday = computed(() => {
  return !!initialValues.value.birthday;
});

const isAdult = ref(false);

// Format date part to add leading zero
function formatDatePart(value: number | ""): string {
  if (value === "" || value === undefined || value === null) return "";
  return String(value).padStart(2, '0');
}

function onToggleSensitive() {
  if (!isAdult.value) return;

  showSensitive.value = !showSensitive.value;

  api.modifySensitive({
    show_nsfw: showSensitive.value ? 1 : 0,
  })
    .then((res: any) => {
      if (res.code !== 200 && res.code !== 0) {
        showSensitive.value = !showSensitive.value;
        toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
    const res = (await api.userInfo()) as any;
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
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
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

  const authHeaders = window.AntiCrawler.generateAuthParams(token);

  const parma = { method: "POST", headers: { token, 'Platform': 'web', ...authHeaders }, body: formData };
  fetch(baseUrl + "user/uploadImage", parma)
    .then((r) => r.json())
    .then(
      (res: any) => {
        if (res.code === 0 || res.code === 200) {
          const url = (typeof res.data === "string" ? res.data : res.data?.url) || res.url;
          if (typeof url === "string") {
            cb(url);
            toast(t('success'));
          }
        } else {
          toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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
  if (nickname.value.includes('#') || nickname.value.includes('@') || nickname.value.includes(' ')) {
    toast(t('user.personal.usernameWarning'));
    return;
  }

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
.user-personal-edit {
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

.content .label {
  margin-bottom: 16px;
  font-weight: 800;
  font-size: 13px;
  color: #161122;
  letter-spacing: 0.02em;
}
.content .label span {
  color: #E5484D;
}
.content .label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.count {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  color: #161122;
  margin-left: 10px;
}

.section {
  margin-bottom: 24px;
}

.avatar-wrap {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}
.avatar-img {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  border: 4px solid #161122;
  object-fit: cover;
  box-shadow: 4px 4px 0 rgba(22,17,34,.2);
}
.reupload-box {
  position: relative;
  cursor: pointer;
}
.reupload {
  color: #FF4D8D;
  font-weight: 800;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}
.hidden-file {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 80px;
  height: 30px;
  opacity: 0;
  cursor: pointer;
  z-index: 5;
}

.input-text {
  width: 100%;
  box-sizing: border-box;
  height: 48px;
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
.input-text:focus {
  box-shadow: 3px 3px 0 rgba(255,77,141,.42);
}
.input-text::placeholder {
  color: #bdb7c4;
}

.birthday-tip {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  color: #161122;
  margin-left: 4px;
}
.birth-box {
  font-weight: 800;
  font-size: 15px;
  color: #161122;
  padding: 13px 15px;
  border: 2.5px solid #161122;
  border-radius: 12px;
  background: #fff;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.btn {
  height: 48px;
  min-width: 136px;
  padding: 13px 18px;
  border: 2.5px solid #161122;
  border-radius: 13px;
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 3px 3px 0 #161122;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
}
.btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 #161122;
}
.btn-cancel {
  background: #fff;
  color: #161122;
}
.btn-save {
  background: #FF4D8D;
  color: #fff;
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: 3px 3px 0 #161122;
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
    padding: 80px 30px 24px;
  }
  .main {
  padding: 24px;
  }
  .content {
    padding: 20px 16px;
  }
}
@media (max-width: 420px) {
  .content {
    padding: 16px 12px;
  }
}
</style>
