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
    const res = (await api.getProfile()) as any;
    if ((res.code == 200 || res.code == 0)) {
      bio.value = res.data?.page_desc || "";
      headerUrl.value = res.data?.page_banner || defaultImg;
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
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

  const parma = { method: "POST", headers: { token, 'Platform': 'web', ...authHeaders }, body: formData };
  fetch(baseUrl + "user/uploadImage", parma)
    .then((r) => r.json())
    .then(
      (res: any) => {
        isUploading.value = false;
        if (res.code === 0 || res.code === 200) {
          const url = (typeof res.data === "string" ? res.data : res.data?.url) || res.url;
          if (typeof url === "string") cb(url);
        } else {
          toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
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

<style scoped lang="css">
.user-profile-edit {
  width: 100%;
  min-height: 100vh;
  background: #1a1a1a;
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
  border: 1px solid #3d3d3d;
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
  color: #f5f5f5;
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
  background: #ff4f9a;
}
.content {
  min-height: 380px;
}
.content .label {
  margin-bottom: 7px;
  font-weight: 800;
  font-size: 13px;
  color: #f5f5f5;
  letter-spacing: 0.02em;
}
.content .label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section {
  margin-bottom: 15px;
}
.textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  padding: 13px 15px;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  background: #1a1a1a;
  font-weight: 600;
  font-size: 15px;
  color: #f5f5f5;
  outline: none;
  resize: vertical;
  line-height: 1.7;
  transition: box-shadow 0.18s;
}
.textarea:focus {
  box-shadow: 0 0 0 2px rgba(255,79,154,0.3);
}
.textarea::placeholder {
  color: #777;
}
.reupload {
  display: inline-block;
  border: 1px solid #3d3d3d;
  border-radius: 13px;
  background: #1a1a1a;
  color: #f5f5f5;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 18px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.reupload:hover {
  box-shadow: none;
}
.header-wrap {
  position: relative;
  margin-top: 7px;
}
.header-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #3d3d3d;
}
.hidden-file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.hint {
  font-weight: 600;
  font-size: 13px;
  color: #777;
  margin-top: 12px;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.btn-cancel {
  border: 1px solid #3d3d3d;
  border-radius: 13px;
  background: #1a1a1a;
  color: #f5f5f5;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 18px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s;
  white-space: nowrap;
}
.btn-cancel:hover {
  box-shadow: none;
}
.btn-save {
  border: 1px solid #3d3d3d;
  border-radius: 13px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  border: 2px solid #ff9aca;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(255, 61, 134, .3);
  transition: box-shadow 0.14s;
  white-space: nowrap;
}
.btn-save:hover:not(:disabled) {
  box-shadow: none;
}
.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  .header-img {
    height: 120px;
  }
}
</style>
