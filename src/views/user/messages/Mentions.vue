<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id" @click="toDetail(item.post, item.comment)">
      <div class="left-info">
        <img class="avatar" :src="item.poster.avatar || defaultAvatar" alt="" @click.stop="goUserHome(item.poster.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.poster.nickname }}</div>
          <div class="desc">
            {{ t("user.messages.mentionsText") }}: <span class="content">{{ item.post.content }}</span>
          </div>
          <div class="time">{{ formatTimestamp(item.timestamp) }}</div>
        </div>
      </div>
      <div class="right-work-box">
        <div class="line"></div>
        <div class="right-work">
          <img class="work-cover" :src="processImageUrl(item.post.cover)" alt="" />
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
import { formatTimestamp, processImageUrl } from "@/util/utils";
import EmptyState from "@/components/EmptyState.vue";
import { toast } from "@/util/toast";
import defaultAvatar from "@/assets/images/base/avatar.png";

const { t, locale } = useI18n();
const router = useRouter();
defineProps<{ list: any[] }>();

function toDetail(post: any, comment: any) {
  if (post && parseInt(post.access_rights) <= 0) {
    toast(t('mentions.postDeleted'));
    return false;
  }

  // Only show deleted message if status explicitly indicates deleted (0)
  // Don't treat missing status or other values as deleted
  if (comment && comment.status == 0) {
    toast(t('mentions.commentDeleted'));
    return false;
  }

  // Distinguish between content mention and comment mention
  if (comment) {
    // Comment mention - jump to the specific comment
    if (!comment.parent_id) {
      // Direct comment mention
      router.push(`/detail?id=${post.post_id}&cid=${comment.comment_id}`);
    } else {
      // Reply comment mention - jump to parent comment with reply highlight
      router.push(`/detail?id=${post.post_id}&cid=${comment.parent_id}&rid=${comment.comment_id}`);
    }
  } else {
    // Content mention - just jump to the post
    router.push(`/detail?id=${post.post_id}`);
  }
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
  display: flex;
  align-items: center;
  font-size: 1.4rem;
  color: #364153;
}
.content {
  max-width: 44rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #364153;
}
.time {
  font-size: 1.2rem;
  color: #99A1AF;
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
    background: #F5F5F5;
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
  color: #99A1AF;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
