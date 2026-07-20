<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id">
      <div class="left-info">
        <img class="avatar" :src="item.author_info?.avatar || defaultAvatar" alt="" @click="goUserHome(item.author_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.author_info?.nickname }}</div>
          <div class="desc">{{ item.status == 'expired' ? t("user.messages.expiredText") : t("user.messages.expireText") }}</div>
          <div class="time">{{ formatTimestamp(item.timestamp) }}</div>
        </div>
      </div>
      <button class="action-btn" @click="toSubscribe(item.author_id)" v-if="item.status == 'expired'">
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
  gap: 13px;
}
.msg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-radius: 19px;
  transition: all 0.2s;
  cursor: pointer;
}
.msg-item:hover {
  box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.06);
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
  color: #364153;
}
.time {
  font-size: 12px;
  color: #99A1AF;
  font-weight: 300;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 260px;
  padding: 0 26px;
  height: 64px;
  background: #fb64b6;
  border-radius: 13px;
  color: #ffffff;
  border: none;
  font-size: 14px;
  cursor: pointer;
  gap: 10px;
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
  width: 26px;
  height: 26px;
}

@media (max-width: 420px) {
  .msg-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 13px;
    padding: 19px;
  }
  .action-btn {
    width: 100%;
    min-width: auto;
    height: 58px;
  }
  .avatar {
    width: 58px;
    height: 58px;
  }
}
</style>
