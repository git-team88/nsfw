<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id" @click="toDetail(item.workId)">
      <div class="left-info">
        <img class="avatar" :src="item.poster.avatar" alt="" @click.stop="goUserHome(item.poster.user_id)" />
        <div class="text-col">
          <div class="username">{{ item.poster.nickname }}</div>
          <div class="desc">{{ t("user.messages.mentionsText") }}: {{ item.post.content }}</div>
          <div class="time">{{ formatTimestamp(item.timestamp) }}</div>
        </div>
      </div>
      <div class="right-work-box">
        <div class="line"></div>
        <div class="right-work">
          <img class="work-cover" :src="item.post.cover" alt="" />
          <div class="work-title">{{ item.post.title }}</div>
        </div>
      </div>
    </div>
    <EmptyState v-if="!list.length" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { formatTimestamp } from "@/util/utils";
import EmptyState from "@/components/EmptyState.vue";

const { t, locale } = useI18n();
const router = useRouter();
defineProps<{ list: any[] }>();

function toDetail(id: string | number) {
  router.push(`/detail?id=${id}`);
}

function goUserHome(userId: string) {
  router.push(`/user-home?id=${userId}`);
}
</script>

<style scoped lang="scss">
.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
.msg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.8rem;
  border: 1px solid rgba(251, 100, 182, 0.1);
  border-radius: 1.2rem;
  transition: all 0.2s;
  cursor: pointer;
}
.msg-item:hover {
  box-shadow: 0px 0px 12px 0px rgba(251, 100, 182, 0.06);
}
.left-info {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
}
.avatar {
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 0.8rem;
  object-fit: cover;
}
.text-col {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.username {
  font-size: 1.4rem;
  color: #101828;
}
.desc {
  max-width: 54rem;
  font-size: 1.4rem;
  color: #4a5565;
}
.time {
  font-size: 1.2rem;
  color: #99a1af;
  font-weight: 300;
}

.right-work-box {
  display: flex;
  align-items: center;
  width: 34rem;
  gap: 1.8rem;

  .line {
    width: 1px;
    height: 4rem;
    background: rgba(251, 100, 182, 0.1);
  }
}

.right-work {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
}
.work-cover {
  width: 5.4rem;
  height: 7.2rem;
  object-fit: cover;
  border-radius: 0.8rem;
}
.work-title {
  font-weight: 500;
  font-size: 1.4rem;
  line-height: 2rem;
  color: #364153;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
