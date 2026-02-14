<template>
  <div class="success">
    <Header ref="headerRef" :cur="-1"></Header>

    <div class="container">
      <div class="title">{{ t("register.success.title") }}</div>

      <!-- <div class="content" v-html="t('register.success.content')"></div> -->

      <div class="home-btn" @click="goHome()">{{ t("register.success.home") }}</div>
      <div class="task-btn" @click="goTask()">
        <span>{{ t("register.success.task") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RegisterSuccess">
import Header from "@/components/Header.vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { onMounted, ref } from "vue";

const router = useRouter();
const { t, locale } = useI18n();

const headerRef = ref<InstanceType<typeof Header> | null>(null);

onMounted(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/");
  }
});

function goHome() {
  router.push("/");
}

function goTask() {
  router.push("/task");
}
</script>

<style lang="scss" scoped>
.success {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 48rem;
    width: 100%;
    height: 100%;
    margin: 0 auto;

    .title {
      font: {
        weight: 500;
        size: 2rem;
      }
      color: rgba(255, 255, 255, 0.9);
    }

    .content {
      margin: 3rem 0;
      font: {
        size: 1.4rem;
      }
      line-height: 2.2rem;
      color: rgba(255, 255, 255, 0.7);

      :deep(span) {
        color: #33a3ff;
      }
    }

    .home-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42rem;
      height: 4.8rem;
      margin: 3rem 0 1.4rem;
      font-size: 1.6rem;
      background: linear-gradient(90deg, #fb64b6 0%, #ff94ce 100%);
      border-radius: 0.8rem;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(251, 100, 182, 0.3);
      }
    }

    .task-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42rem;
      height: 4.8rem;
      font-size: 1.6rem;
      background: transparent;
      border: 1px solid #fb64b6;
      border-radius: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(251, 100, 182, 0.2);
      }

      span {
        background: linear-gradient(90deg, #fb64b6 0%, #ff94ce 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
}
</style>
