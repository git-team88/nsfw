<template>
  <div class="user-privacy">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.privacy.title") }}</div>
          </div>
          <div class="content">
            <div class="item" v-for="item in settings" :key="item.key">
              <div class="label">{{ t(item.label) }}</div>
              <img
                class="switch"
                :src="info[item.key] == '1' ? openIcon : closeIcon"
                @click="toggle(item.key)"
                alt="switch"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="UserPrivacy">
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import openIcon from "@/assets/images/user/open.png";
import closeIcon from "@/assets/images/user/close.png";
import api from "@/api/index";
import { toast } from "@/util/toast";

const { t, locale } = useI18n();
const sidebarKey = ref("privacy");
const saving = ref(false);

const info = ref<Record<string, string>>({
  is_subs_list_private: '0',
  is_fans_list_private: '0',
  is_anonymous_follow: '0',
  is_anonymous_subs: '0',
  is_anonymous_comment: '0',
});

const settings = [
  { key: "is_subs_list_private", label: "user.privacy.subscribe" },
  { key: "is_fans_list_private", label: "user.privacy.followers" },
  // { key: "is_anonymous_follow", label: "user.privacy.anonymous_follow" },
  // { key: "is_anonymous_subs", label: "user.privacy.anonymous_subscribe" },
  // { key: "is_anonymous_comment", label: "user.privacy.anonymous_comments" },
];

interface SwitchInfo {
  is_subs_list_private?: string;
  is_fans_list_private: string,
  is_anonymous_follow: string,
  is_anonymous_subs: string,
  is_anonymous_comment: string,
}

onMounted(async () => {
  try {
    const res = (await api.getPrivacy()) as unknown as { code: number; data: SwitchInfo };
    if (res.code === 0 && res.data) {
      info.value.is_subs_list_private = res.data.is_subs_list_private || '0';
      info.value.is_fans_list_private = res.data.is_fans_list_private || '0';
      info.value.is_anonymous_follow = res.data.is_anonymous_follow || '0';
      info.value.is_anonymous_subs = res.data.is_anonymous_subs || '0';
      info.value.is_anonymous_comment = res.data.is_anonymous_comment || '0';
    }
  } catch (e) {
    console.error(e);
  }
});

function toggle(key: string) {
  saving.value = true;

  // Create a copy of current info
  const currentValue = info.value[key];
  const newValue = currentValue == '1' ? '0' : '1';

  // Create a temporary object with the new value
  const tempInfo = { ...info.value };
  tempInfo[key] = newValue;

  api
    .modifyPrivacy(tempInfo)
    .then((res: unknown) => {
      saving.value = false;
      const r = res as { code: number; msg: string };
      if (r.code === 0) {
        // Set the value to the new value if API call succeeds
        info.value[key] = newValue;
        toast(t('success'));
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
.user-privacy {
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
  padding: 2.4rem 3.6rem;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 2.4rem 0;
}
.panel-title {
  font-weight: 500;
  font-size: 2rem;
  color: #101828;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 5.6rem;
  border-bottom: 1px solid rgba(251, 100, 182, 0.1);
}
.label {
  font-size: 1.4rem;
  color: #364153;
}
.switch {
  width: 4.4rem;
  height: 2.4rem;
  cursor: pointer;
}
</style>
