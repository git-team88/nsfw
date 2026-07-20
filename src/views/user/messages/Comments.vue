<template>
  <div class="list-wrap">
    <div class="msg-item" v-for="item in list" :key="item.id" @click="toDetail(item.post, item.comment)">
      <div class="left-info">
        <img class="avatar" :src="item.commenter.avatar || defaultAvatar" alt="" @click.stop="goUserHome(item.commenter.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.commenter.nickname }}</div>
          <div class="desc" v-if="item.comment.parent_id == 0">
            {{ t("user.messages.commentedText") }} <span class="content">{{ item.comment.content }}</span>
          </div>
          <div class="desc" v-else-if="item.comment.parent_id > 0">
            {{ t("user.messages.replyComment").replace("[Comment]", ("[" + item.comment.reply_to_nickname + "]") ) }}
            <span class="content">{{ item.comment.content }}</span>
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

  if (comment && comment.status == 0) {
    toast(t('mentions.commentDeleted'));
    return false;
  }

  if (comment && !comment.parent_id) {
    router.push(`/detail?id=${post.post_id}&cid=${comment.comment_id}`);
  } else if (comment && comment.parent_id) {
    router.push(`/detail?id=${post.post_id}&cid=${comment.parent_id}&rid=${comment.comment_id}`);
  } else {
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
  gap: 13px;
}
.msg-item {
  display: flex;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid rgba(251, 100, 182, 0.1);
  border-radius: 19px;
  transition: all 0.2s;
  cursor: pointer;
}
.msg-item:hover {
  box-shadow: 0px 0px 12px 0px rgba(251, 100, 182, 0.06);
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
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #364153;
}
.content {
  max-width: 704px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #364153;
}
.time {
  font-size: 12px;
  color: #99A1AF;
  font-weight: 300;
}

.right-work-box {
  display: flex;
  align-items: center;
  width: 544px;
  gap: 29px;

  .line {
    width: 1px;
    height: 64px;
    background: #F5F5F5;
  }
}

.right-work {
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
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #99A1AF;
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
  .content {
    max-width: 100%;
    white-space: normal;
  }
  .avatar {
    width: 58px;
    height: 58px;
  }
}
</style>
