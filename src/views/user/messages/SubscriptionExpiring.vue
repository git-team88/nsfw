<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id">
      <div class="left-info">
        <img class="avatar" :src="item.subscriberr.avatar || defaultAvatar" alt="" @click="goUserHome(item.subscriberr.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.subscriberr.nickname }}</div>
          <div class="desc">{{ t("user.messages.expireText") }}</div>
          <div class="time">{{ formatTimestamp(item.timestamp) }}</div>
        </div>
      </div>
      <button class="action-btn" @click="toSubscribe(item.subscriberrr.user_id)">
        {{ t("user.messages.subscribeNow") }}
        <img class="btn-icon" :src="subscribeIcon" alt="" />
      </button>
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
import subscribeIcon from "@/assets/images/user/subscribe_icon.png";

const { t, locale } = useI18n();
const router = useRouter();

const props = defineProps<{
  list: any[];
}>();

function toSubscribe(userId: string | number) {
  router.push(`/subscription-payment?uid=${userId}`);
}

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
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 16.2rem;
  padding: 0 1.6rem;
  height: 4rem;
  background: #fb64b6;
  border-radius: 0.8rem;
  color: #ffffff;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0px 2px 15px -3px rgba(251, 100, 182, 0.16);

  &:hover{
    position: relative;
    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      z-index: 1;
    }
  }
}
.btn-icon {
  width: 1.6rem;
  height: 1.6rem;
}
</style>
