<template>
  <div class="list-wrap">
    <div class="msg-item" :style="{ animationDelay: `${Math.min(index, 12) * 45}ms` }" v-for="(item, index) in list" :key="item.id" @click="toDetail(item.post)">
      <div class="left-info">
        <img class="avatar" :src="item.liker.avatar || defaultAvatar" alt="" @click.stop="goUserHome(item.liker.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.liker.nickname }}</div>
          <div class="desc">{{ t("user.messages.likedText") }}</div>
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
import { toast } from "@/util/toast";
import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();
const router = useRouter();
defineProps<{ list: any[] }>();

function toDetail(post: any) {
  if (post && parseInt(post.access_rights) <= 0) {
    toast(t('mentions.postDeleted'));
    return false;
  }

  router.push(`/detail?id=${post.post_id}`);
}

function goUserHome(userId: string) {
  router.push(`/user-home?id=${userId}`);
}
</script>

<style scoped lang="scss">
.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.msg-item {
  animation: msgItemIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  display: flex;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid #3d3d3d;
  border-radius: 19px;
  will-change: transform;
  transition: transform 0.12s ease-out;
  cursor: pointer;
}
.msg-item:hover {
  background: rgba(255,255,255,0.06);
}
.left-info {
  min-width: 0;
  display: flex;
  gap: 19px;
  align-items: flex-start;
}
.avatar {
  width: 70px;
  height: 70px;
  border-radius: 13px;
  object-fit: cover;
}
.text-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.username {
  font-size: 14px;
  color: #aaa;
}
.desc {
  font-size: 14px;
  color: #f5f5f5;
}
.time {
  font-size: 12px;
  color: #777;
  font-weight: 300;
}

.right-work-box {
  display: flex;
  align-items: center;
  flex: 0 1 544px;
  min-width: 0;
  gap: 29px;

  .line {
    width: 1px;
    height: 64px;
    background: #2c2c2c;
  }
}

.right-work {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 19px;
}
.work-cover {
  width: 86px;
  height: 115px;
  object-fit: cover;
  border-radius: 13px;
}
.work-title {
  min-width: 0;
  font-weight: 500;
  font-size: 14px;
  line-height: 22px;
  color: #f5f5f5;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 420px) {
  .msg-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 19px;
  }
  .right-work-box {
    width: 100%;
    margin-top: 13px;
  }
  .avatar {
    width: 58px;
    height: 58px;
  }
}

@keyframes msgItemIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .msg-item { animation: none; }
}
</style>
