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
  max-width: 48rem;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  padding: 16rem 0 3rem;

  .tip {
    margin-bottom: 4rem;
    font: {
      weight: 500;
      size: 2.4rem;
    }
    line-height: 3.6rem;
    color: #101828;
  }

  .form {
    .info-item {
      display: flex;
      align-items: center;
      margin: 0 0 2.4rem -9rem;

      label {
        width: 7rem;
        text-align: right;
        margin: 0 2rem 0 0;
        font-size: 1.4rem;
        color: #4a5565;
      }

      .name-ipt {
        width: 48rem;
        height: 5rem;
        padding: 1rem;
        font-size: 1.6rem;
        border: 1px solid #fccee8;
        -webkit-border-radius: 0.8rem;
        border-radius: 0.8rem;
        background: rgba(255, 255, 255, 0.9);
        color: #101828;

        &:hover,
        &:focus {
          border: 1px solid #fb64b6;
        }
      }

      .avatar-box {
        display: flex;
        align-items: flex-end;

        .avatar {
          width: 8rem;
          height: 8rem;
          margin-right: 1rem;
          border: 1px solid #fb64b6;
          border-radius: 0.8rem;
          -webkit-border-radius: 0.8rem;
          object-fit: cover;
        }

        .avatar-upload {
          position: relative;
          cursor: pointer;

          span {
            font-size: 1.4rem;
            color: #fb64b6;
          }

          .avatar-ipt {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 4rem;
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
          margin-right: 2rem;
          cursor: pointer;

          &:last-child {
            margin-right: 0;
          }

          img {
            width: 2.4rem;
            height: 2.4rem;
            margin-right: 0.6rem;
          }

          span {
            font-size: 1.6rem;
            color: #364153;
          }
        }
      }
    }

    .info-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48rem;
      height: 4.8rem;
      font-size: 1.6rem;
      -webkit-border-radius: 0.8rem;
      border-radius: 0.8rem;
      background: linear-gradient(45deg, #fb64b6 0%, #ff94ce 50%, #fb64b6 100%);
      color: #ffffff;
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
    width: 3.2rem;
    height: 3.2rem;
    animation: rotate 2s linear infinite;
  }
  p {
    margin: 2rem 0 0;
    font: {
      size: 1.8rem;
      weight: 500;
    }
    color: #ffffff;
  }
}
</style>
