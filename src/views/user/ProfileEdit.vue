<template>
  <div class="user-profile-edit">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.profile.title") }}</div>
          </div>

          <div class="content">
            <div class="section">
              <div class="label">{{ t("user.profile.bio") }}</div>
              <textarea
                class="textarea"
                v-model="bio"
                :maxlength="500"
                spellcheck="false"
                :placeholder="t('user.profile.defaultBio')"
              ></textarea>
            </div>
            <div class="section">
              <div class="label-row">
                <div class="label">{{ t("user.profile.headerImage") }}</div>
                <button class="reupload" @click="pickHeader">{{ t("submit.video.reupload") }}</button>
              </div>
              <div class="header-wrap">
                <img class="header-img" :src="headerUrl || headerImgDefault" alt="" />
                <input
                  ref="headerInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden-file"
                  @change="onHeaderPicked"
                />

              </div>
              <div class="hint">{{ t("user.profile.sizeText") }}</div>
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
        </div>
      </div>
    </div>
  </div>

  <UploadMask :visible="isUploading"></UploadMask>
</template>

<script setup lang="ts" name="UserProfileEdit">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import UploadMask from "@/components/UploadMask.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
import headerImgDefault from "@/assets/images/user/pic.jpg";
import { baseUrl } from "@/util/config";
import { toast } from "@/util/toast";
import router from "@/router";
import api from "@/api/index";

const sidebarKey = ref("profile");
const bio = ref("");
const headerInputRef = ref<HTMLInputElement | null>(null);
const headerUrl = ref("");
const saving = ref(false);
const isUploading = ref(false);
const defaultImg = 'https://ddu2v98cehw9k.cloudfront.net/images/2026-02-02/14_4ea89113891e84ff21c06461a8a5d2da64d5.png'

onMounted(async () => {
  try {
    const res = (await api.getProfile()) as unknown as { code: number; data: Record<string, any> };
    if ((res.code === 200 || res.code === 0) && res.data) {
      bio.value = res.data.page_desc || "";
      headerUrl.value = res.data.page_banner || defaultImg;
    }
  } catch (e) {
    console.error(e);
  }
});

function pickHeader() {
  headerInputRef.value?.click();
}
function onHeaderPicked() {
  uploadFile(headerInputRef.value, (url) => {
    headerUrl.value = url;
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

  const parma = { method: "POST", headers: { token, ...authHeaders }, body: formData };
  fetch(baseUrl + "user/uploadImage", parma)
    .then((r) => r.json())
    .then(
      (res: { code: number; data?: { url?: string } | string; url?: string; msg: string; msg_jp: string }) => {
        isUploading.value = false;
        if (res.code === 0 || res.code === 200) {
          const url = (typeof res.data === "string" ? res.data : res.data?.url) || res.url;
          if (typeof url === "string") cb(url);
        } else {
          toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
        }
      },
    )
    .catch((e: unknown) => {
      isUploading.value = false;
      toast(String(e));
    });
}

function onCancel() {
  router.push("/user-profile");
}
function onSave() {
  saving.value = true;
  api
    .modifyProfile({
      description: bio.value,
      pic: headerUrl.value,
    })
    .then((res: unknown) => {
      saving.value = false;
      const r = res as { code: number; msg: string };
      if (r.code === 200 || r.code === 0) {
        toast(t('success'));
        router.push("/user-profile");
      } else {
        toast(r.msg);
      }
    })
    .catch((e: unknown) => {
      saving.value = false;
      toast(String(e));
    });
}
</script>

<style scoped lang="scss">
.user-profile-edit {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 4.8rem;
  padding-right: 4.8rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
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
  color: #99A1AF;
}

.content {
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: #F5F5F5;
}
.section {
  margin-bottom: 2.4rem;
}
.label {
  font-size: 1.4rem;
  color: #6A7282;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.textarea {
  width: 100%;
  height: 12rem;
  margin-top: 1.6rem;
  padding: 1.6rem;
  border: 1px solid #FFFFFF;
  border-radius: 0.8rem;
  font-family: inherit;
  background: #FFFFFF;
  outline: none;
  color: #364153;
}
.textarea:focus {
  border: 1px solid #fb64b6;
}
.textarea::placeholder {
  color: #99A1AF;
}
.reupload {
  background: none;
  border: none;
  color: #FB64B6;
  cursor: pointer;
  font-size: 1.2rem;
}
.header-wrap {
  position: relative;
  margin-top: 1.6rem;
}
.header-img {
  width: 100%;
  height: 16rem;
  object-fit: cover;
  border-radius: 0.8rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
}
.hidden-file {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.hint {
  font-weight: 300;
  font-size: 1.2rem;
  color: #99a1af;
  margin-top: 1.2rem;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
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
  background: rgba(255, 255, 255, 0.1);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
