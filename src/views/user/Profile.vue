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
const { t, locale } = useI18n();

const sidebarKey = ref("profile");
const userInfo = ref<Record<string, any>>({});
const defaultImg = 'https://ddu2v98cehw9k.cloudfront.net/images/2026-02-02/14_4ea89113891e84ff21c06461a8a5d2da64d5.png'

onMounted(async () => {
  try {
    const res = (await api.getProfile()) as unknown as { code: number; data: Record<string, any> };
    if (res.code === 200 || res.code === 0) {
      userInfo.value = res.data || {};
    }
  } catch (e) {
    console.error(e);
  }
});

function goEdit() {
  router.push("/user-profile-edit");
}
</script>

<style scoped lang="scss">
.user-profile {
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
  margin: 0 0 1.2rem 1.2rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}

.content {
  padding: 1.2rem;
  border-radius: 1.2rem;
}
.content:hover {
  background: rgba(251, 100, 182, 0.04);
}
.section {
  margin-bottom: 2.4rem;
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
  font-size: 1.4rem;
  color: #364153;
}
.edit-link {
  background: none;
  border: none;
  color: #fb64b6;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0;
}
.bio {
  min-height: 5.4rem;
  display: flex;
  align-items: center;
  margin-top: 1.6rem;
  padding: 1.6rem;
  font-size: 1.4rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  color: #364153;
  background: #ffffff;
}
.header-img {
  width: 100%;
  height: 16rem;
  margin-top: 1.6rem;
  object-fit: cover;
  border-radius: 0.8rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
}
</style>
