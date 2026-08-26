<template>
  <div class="user-profile">
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
              <div class="label-row">
                <div class="label">{{ t("user.profile.bio") }}</div>
                <button class="edit-link" @click="goEdit">{{ t("user.profile.edit") }}</button>
              </div>
              <div class="bio">{{ userInfo.page_desc || t("user.profile.defaultBio") }}</div>
            </div>
            <div class="section">
              <div class="label">{{ t("user.profile.headerImage") }}</div>
              <img class="header-img" :src="userInfo.page_banner || defaultImg" alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserProfileSettings">
import { ref, onMounted } from "vue";
import router from "@/router";
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import api from "@/api/index";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

const sidebarKey = ref("profile");
const userInfo = ref<Record<string, any>>({});
const defaultImg = 'https://ddu2v98cehw9k.cloudfront.net/images/2026-02-02/14_4ea89113891e84ff21c06461a8a5d2da64d5.png'

onMounted(async () => {
  window.scrollTo(0, 0);
  try {
    const res = (await api.getProfile()) as any;
    if (res.code == 200 || res.code == 0) {
      userInfo.value = res.data || {};
    } else {
      toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp);
    }
  } catch (e) {
    console.error(e);
  }
});

function goEdit() {
  router.push("/user-profile-edit");
}
</script>

<style scoped lang="css">
.user-profile {
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
.section {
  margin-bottom: 24px;
}
.section:last-child {
  margin-bottom: 0;
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label {
  font-weight: 800;
  font-size: 13px;
  color: #f5f5f5;
  letter-spacing: 0.02em;
}
.edit-link {
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
.edit-link:hover {
  box-shadow: none;
}
.bio {
  margin-top: 12px;
  font-weight: 800;
  font-size: 14px;
  color: #f5f5f5;
  line-height: 1.8;
}
.header-img {
  width: 100%;
  height: 180px;
  margin-top: 12px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #3d3d3d;
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
