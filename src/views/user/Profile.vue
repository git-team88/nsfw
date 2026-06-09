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

<style scoped lang="scss">
.user-profile {
  width: 100%;
  min-height: 100vh;
  background: #FFFFFF;
}
.container {
  max-width: 144rem;
  margin: 0 auto;
  display: flex;
  gap: 6rem;
  padding-right: 6rem;
}
.main {
  flex: 1;
  padding-top: 14rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #99A1AF;
  padding-left: 1.2rem;
}

.content{
  padding: 1.2rem;
  border-radius: 1.2rem;
  background: #F9FAFB;
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
  color: #99A1AF;
}
.edit-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 8.8rem;
  height: 4rem;
  background: #FB64B6;
  border: none;
  border-radius: 0.8rem;
  color: #FFFFFF;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0 1rem;
}
.bio {
  margin-top: 1.2rem;
  font-weight: 500;
  font-size: 1.4rem;
  color: #364153;
}
.header-img {
  width: 100%;
  height: 16rem;
  margin-top: 1.2rem;
  object-fit: cover;
  border-radius: 0.8rem;
}
</style>
