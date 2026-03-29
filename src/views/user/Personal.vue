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
          <!-- <div class="panel-id">ID:{{ userInfo.info?.id || "--" }}</div> -->
          <div class="content">
            <div class="section">
              <div class="label-row">
                <div class="label">{{ t("user.personal.username") }}</div>
                <button class="edit-link" @click="goEdit">{{ t("user.profile.edit") }}</button>
              </div>
              <div class="username-box">{{ userInfo.info?.nickname || "-" }}</div>
            </div>
            <div class="section">
              <div class="label">{{ t("user.personal.avatar") }}</div>
              <img class="avatar-img" :src="userInfo.info?.avatar" alt="" />
            </div>

            <div class="section">
              <div class="label">{{ t("birthday.label") }}</div>
              <div class="birth-box">
                {{ dateValue.month }}-{{ dateValue.day }}-{{ dateValue.year }}
              </div>
            </div>
          </div>

          <div class="sensitive-row" v-if="userRegion">
            <div class="switch-box">
              <div class="label">
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
}
.panel-id {
  margin: 0 0 1.2rem 1.2rem;
  font-size: 1.6rem;
  color: #fb64b6;
}

.section {
  margin-bottom: 1.8rem;
}

.sensitive-row {
  margin: 2.4rem 0 0;

  .switch-box {
    display: flex;
    align-items: center;
    gap: 2.4rem;
    margin-bottom: 1.2rem;

    .label {
      color: #99A1AF;
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
  color: #99A1AF;
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
  margin-top: 1.2rem;
  font-weight: 500;
  color: #364153;
  font-size: 1.4rem;
}
.avatar-img {
  width: 11.2rem;
  height: 11.2rem;
  border-radius: 0.8rem;
  object-fit: cover;
  margin-top: 1.2rem;
}
.birth-box {
  margin-top: 1.2rem;
  font-weight: 500;
  font-size: 1.4rem;
  color: #364153;
}
</style>
