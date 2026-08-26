<template>
  <div class="container">
    <div class="tip">{{ t("header.info.tip") }}</div>

    <form class="form">
      <div class="info-item">
        <label>{{ t("header.info.username") }}</label>
        <input
          class="name-ipt"
          type="text"
          v-model="userInfo.nickname"
          spellcheck="false"
          autocomplete="false"
        />
      </div>

      <div class="info-item">
        <label>{{ t("header.info.avatar") }}</label>

        <div class="avatar-box">
          <img class="avatar" :src="userInfo.avatar" alt="avatar" />

          <div class="avatar-upload">
            <span>{{ t("header.info.upload") }}</span>
            <input
              ref="uploadRef"
              class="avatar-ipt"
              type="file"
              title=""
              accept="image/*"
              @change="upload()"
            />
          </div>
        </div>
      </div>

      <div class="info-item">
        <label>{{ t("header.info.age") }}</label>

        <div class="info-age">
          <div
            class="info-age-list"
            v-for="(item, index) in ageList"
            :key="index"
            @click="checkAge(index)"
          >
            <img src="@/assets/images/header/check_active.png" alt="" v-if="age == index + 1" />
            <img src="@/assets/images/header/check.png" alt="" v-else />

            <span class="">{{ item }}</span>
          </div>
        </div>
      </div>

      <div class="info-btn" @click="modifyInfo()">{{ t("header.info.confirm") }}</div>
    </form>
  </div>

  <div class="load" v-if="isUpload">
    <img src="@/assets/images/base/load.png" alt="" />
    <p>{{ t("upload") }}</p>
  </div>
</template>

<script setup lang="ts" name="Info">
import Header from "@/components/Header.vue";

import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "@/util/toast";
import api from "@/api/index";
import { baseUrl } from "@/util/config";
import router from "@/router";

import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);
const userInfo = ref({
  nickname: "",
  avatar: "",
  age_range: 0,
});
const uploadRef = ref<HTMLInputElement | null>(null);
const isUpload = ref(false);
const ageList = ref([t("header.info.ageText1"), t("header.info.ageText2")]);
const age = ref(0);

watch(locale, () => {
  ageList.value = [t("header.info.ageText1"), t("header.info.ageText2")];
});

onMounted(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/");
    return false;
  }

  getUserInfo();
});

function getUserInfo() {
  api
    .userInfo()
    .then((res: any) => {
      if (res.code == 0) {
        if (res.data.info && res.data.info.age_range) {
          age.value = res.data.info.age_range;
        }

        if (res.data.info && res.data.info.avatar) {
          userInfo.value.avatar = res.data.info.avatar;
        } else {
          userInfo.value.avatar = defaultAvatar;
        }

        userInfo.value = res.data.info;
      } else {
        toast(locale.value == 'jp'  ?  res.msg_jp  :  res.msg)
      }
    })
    .catch((err: any) => {
      console.log(err);
    });
}

function upload() {
  const token = localStorage.getItem("token");
  if (!token) {
    return false;
  }

  if (uploadRef.value && uploadRef.value.files && uploadRef.value.files.length > 0) {
    const file = uploadRef.value.files[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        toast("上传文件格式错误");
        return false;
      }

      isUpload.value = true;

      const formData = new FormData();
      formData.append("file", file);

      const authHeaders = window.AntiCrawler.generateAuthParams(token);

      const parma = {
        method: "POST",
        headers: {
          token: token,
          'Platform': 'web',
          ...authHeaders,
        },
        body: formData,
      };

      fetch(baseUrl + "user/uploadImage", parma)
        .then((response) => response.json())
        .then((res: any) => {
          if (res.code === 0) {
            isUpload.value = false;
            userInfo.value.avatar = res.data.url;
          } else {
            toast(locale.value == 'en' ? res.msg : locale.value == 'zh' ? res.msg_cn : locale.value == 'tc' ? res.msg_tc : res.msg_jp)
            isUpload.value = false;
          }
        })
        .catch((error: any) => {
          toast(error);
          isUpload.value = false;
        });
    }
  }
}

function checkAge(index: number) {
  age.value = index + 1;
}

function modifyInfo() {
  if (!userInfo.value.nickname) {
    toast(t("header.info.nameTip"));
    return false;
  }

  const data = {
    nickname: userInfo.value.nickname,
    avatar: userInfo.value.avatar,
    age: age.value,
  };

  api
    .modifyInfo(data)
    .then((res: any) => {
      if (res.code == 0) {
        router.push("/");
      } else {
        toast(locale.value == 'jp'  ?  res.msg_jp  :  res.msg)
      }
    })
    .catch((err: any) => {
      console.log(err);
    });
}
</script>

<style lang="scss" scoped>
.container {
  max-width: 480px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 160px 0 30px;

  .tip {
    margin-bottom: 40px;
    font: {
      weight: 500;
      size: 24px;
    }
    line-height: 36px;
    color: #f5f5f5;
  }

  .form {
    .info-item {
      display: flex;
      align-items: center;
      margin: 0 0 24px -90px;

      label {
        width: 70px;
        text-align: right;
        margin: 0 20px 0 0;
        font-size: 14px;
        color: #777;
      }

      .name-ipt {
        width: 480px;
        height: 50px;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #3d3d3d;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: #f5f5f5;

        &:hover,
        &:focus {
          border: 1px solid #ff4f9a;
        }
      }

      .avatar-box {
        display: flex;
        align-items: flex-end;

        .avatar {
          width: 80px;
          height: 80px;
          margin-right: 10px;
          border: 1px solid #ff4f9a;
          border-radius: 8px;
          object-fit: cover;
        }

        .avatar-upload {
          position: relative;
          cursor: pointer;

          span {
            font-size: 14px;
            color: #ff4f9a;
          }

          .avatar-ipt {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 40px;
            opacity: 0;
            z-index: 20;
            cursor: pointer;
          }
        }
      }

      .info-age {
        display: flex;
        align-items: center;
        .info-age-list {
          display: flex;
          align-items: center;
          margin-right: 20px;
          cursor: pointer;

          &:last-child {
            margin-right: 0;
          }

          img {
            width: 24px;
            height: 24px;
            margin-right: 6px;
          }

          span {
            font-size: 16px;
            color: #f5f5f5;
          }
        }
      }
    }

    .info-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 480px;
      height: 48px;
      font-size: 16px;
      border-radius: 8px;
      background: linear-gradient(145deg, #ff74b3, #f73382);
      color: #f5f5f5;
      cursor: pointer;
    }
  }
}

.load {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 800;
  img {
    width: 32px;
    height: 32px;
    animation: rotate 2s linear infinite;
  }
  p {
    margin: 20px 0 0;
    font: {
      size: 18px;
      weight: 500;
    }
    color: #f5f5f5;
  }
}
</style>
