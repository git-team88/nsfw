<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id">
      <div class="left-info">
        <img class="avatar" :src="item.subscriberr.avatar || defaultAvatar" alt="" @click="goUserHome(item.subscriberr.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.subscriberr.nickname }}</div>
          <div class="desc">{{ t("user.messages.subscribedText") }}</div>
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
import { formatTimestamp } from "@/util/utils";
import EmptyState from "@/components/EmptyState.vue";
import { toast } from "@/util/toast";
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
  gap: 0.8rem;
}
.msg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.8rem;
  border-radius: 1.2rem;
  transition: all 0.2s;
  cursor: pointer;
}
.msg-item:hover {
  box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
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
  color: #6A7282;
}
.desc {
  font-size: 1.4rem;
  color: #364153;
}
.time {
  font-size: 1.2rem;
  color: #99A1AF;
  font-weight: 300;
}
</style>
