<template>
  <div class="user-personal">
    <Header :cur="-1"></Header>
    <div class="container">
      <UserSidebar v-model="sidebarKey" />
      <div class="main">
        <div class="panel">
          <div class="panel-top">
            <div class="panel-title">{{ t("user.personal.title") }}</div>
          </div>
          <div class="panel-id">ID:{{ userInfo.info?.id || "--" }}</div>
          <div class="content">
            <div class="section">
              <div class="label-row">
                <div class="label"><span>*</span>{{ t("user.personal.username") }}</div>
                <button class="edit-link" @click="goEdit">{{ t("user.profile.edit") }}</button>
              </div>
              <div class="username-box">{{ userInfo.info?.nickname || "-" }}</div>
            </div>
            <div class="section">
              <div class="label"><span>*</span>{{ t("user.personal.avatar") }}</div>
              <img class="avatar-img" :src="userInfo.info?.avatar" alt="" />
            </div>

            <div class="section">
              <div class="label"><span>*</span>{{ t("birthday.label") }}</div>
              <div class="birth-box">
                <div class="birth-item">
                  <span class="birth-date">{{ dateValue.month }}</span>
                  <span class="birth-text">{{ t("birthday.month") }}</span>
                </div>
                <div class="birth-item">
                  <span class="birth-date">{{ dateValue.day }}</span>
                  <span class="birth-text">{{ t("birthday.day") }}</span>
                </div>
                <div class="birth-item">
                  <span class="birth-date">{{ dateValue.year }}</span>
                  <span class="birth-text">{{ t("birthday.year") }}</span>
                </div>
              </div>
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
  </div>
</template>

<script setup lang="ts" name="UserPersonalInfo">
import { ref, onMounted, computed } from "vue";
import router from "@/router";
import Header from "@/components/Header.vue";
import UserSidebar from "@/components/UserSidebar.vue";
import api from "@/api/index";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
const { t, locale } = useI18n();

const sidebarKey = ref("personal");
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

const userInfo = ref<UserData>({});
const showSensitive = ref(false);
const userRegion = ref(false);

const isAdult = ref(false);
const dateValue = ref<{ year: number | ""; month: number | ""; day: number | "" }>({
  year: "",
  month: "",
  day: "",
});

onMounted(async () => {
  getCountry();

  try {
    const res = (await api.userInfo()) as unknown as { code: number; data: UserData, timestamp: number };
    if (res.code === 0 || res.code === 200) {
      const data = res.data || {};
      userInfo.value = data;

      // Set sensitive content toggle based on show_nsfw value
      if (data.info?.show_nsfw) {
        showSensitive.value = data.info?.show_nsfw == '1';
      }

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

function goEdit() {
  router.push("/user-personal-edit");
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
        toast(locale.value == 'jp' ?  res.msg_jp : res.msg)
      } else {
        toast(t('success'));

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
</script>

<style scoped lang="scss">
.user-personal {
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
}
.content:hover {
  background: rgba(251, 100, 182, 0.04);
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
.label span {
  color: #fa2d47;
}
.edit-link {
  background: none;
  border: none;
  color: #fb64b6;
  cursor: pointer;
  font-size: 1.4rem;
  padding: 0;
}
.text-val {
  font-size: 1.4rem;
  color: #364153;
  margin-top: 1.6rem;
  padding-left: 1rem;
  font-weight: 500;
}
.username-box {
  margin-top: 1.6rem;
  padding: 1.6rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  color: #364153;
  font-size: 1.4rem;
}
.avatar-img {
  width: 11.2rem;
  height: 11.2rem;
  border-radius: 0.8rem;
  object-fit: cover;
  border: 2px solid #fb64b6;
  margin-top: 1.6rem;
}
.birth-box {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-top: 1.6rem;
}
.birth-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.4rem;
}
.birth-date {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10rem;
  height: 5rem;
  border: 1px solid rgba(251, 100, 182, 0.2);
  border-radius: 0.8rem;
  color: #364153;
}
.birth-text {
  color: #6a7282;
}
</style>
