<template>
  <div class="list-wrap">
    <div class="msg-item" :style="{ animationDelay: `${Math.min(index, 12) * 45}ms` }" v-for="(item, index) in list" :key="item.id">
      <div class="left-info">
        <img class="avatar" :src="item.follower.avatar || defaultAvatar" alt="" @click="goUserHome(item.follower.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.follower.nickname }}</div>
          <div class="desc">{{ t("user.messages.followText") }}</div>
          <div class="time">{{ formatTimestamp(item.timestamp) }}</div>
        </div>
      </div>
    </div>
    <EmptyState v-if="!list.length" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import EmptyState from "@/components/EmptyState.vue";
import { formatTimestamp } from "@/util/utils";
import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();
const router = useRouter();
defineProps<{ list: any[] }>();

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
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border: 2px solid #161122;
  border-radius: 19px;
  will-change: transform;
  transition: transform 0.12s ease-out, box-shadow 0.12s;
  cursor: pointer;
}
.msg-item:hover {
  transform: translateX(4px);
  box-shadow: 5px 3px 0 rgba(22, 17, 34, 0.14);
}
.left-info {
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.username {
  font-size: 14px;
  color: #6A7282;
}
.desc {
  font-size: 14px;
  color: #161122;
}
.time {
  font-size: 12px;
  color: #99A1AF;
  font-weight: 300;
}

@media (max-width: 420px) {
  .msg-item {
    padding: 19px;
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
