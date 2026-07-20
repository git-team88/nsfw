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
              <button type="button" role="switch" :aria-checked="info[item.key] == '1'" class="toggle" :class="{ on: info[item.key] == '1' }" @click="toggle(item.key)">
                <span class="knob" aria-hidden="true"></span>
              </button>
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
    const res = (await api.getPrivacy()) as any;
    if (res.code == 0) {
      info.value.is_subs_list_private = res.data?.is_subs_list_private || '0';
      info.value.is_fans_list_private = res.data?.is_fans_list_private || '0';
      info.value.is_anonymous_follow = res.data?.is_anonymous_follow || '0';
      info.value.is_anonymous_subs = res.data?.is_anonymous_subs || '0';
      info.value.is_anonymous_comment = res.data?.is_anonymous_comment || '0';
    } else {
      const msg = locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp;
      toast(msg || t('fail'));
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
        toast(r.msg || t('fail'));
      }
    })
    .catch((e: unknown) => {
      saving.value = false;
      toast(e instanceof Error ? e.message : t('fail'));
    });
}
</script>

<style scoped lang="css">
.user-privacy {
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
.content {
  min-height: 380px;
  margin-top: 16px;
}
.item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 0;
  border-top: 2px solid rgba(22,17,34,.08);
}
.item:first-child {
  border-top: none;
  padding-top: 0;
}
.label {
  font-weight: 800;
  font-size: 14px;
  color: #161122;
  flex: 1;
  min-width: 0;
}
.toggle {
  width: 48px;
  height: 28px;
  border-radius: 999px;
  border: 2.5px solid #161122;
  background: #fff;
  position: relative;
  cursor: pointer;
  flex: none;
  padding: 0;
  transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.toggle .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #161122;
  transition: left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
}
.toggle.on {
  background: #22C55E;
}
.toggle.on .knob {
  left: 22px;
  background: #fff;
}
.toggle:active .knob {
  transform: scaleX(1.18);
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
