<template>
  <div class="list-wrap">
    <div class="msg-item" :style="{ animationDelay: `${Math.min(index, 12) * 45}ms` }" v-for="(item, index) in list" :key="item.id" @click="toDetail(item.post, item.comment)">
      <div class="left-info">
        <img class="avatar" :src="item.commenter.avatar || defaultAvatar" alt="" @click.stop="goUserHome(item.commenter.user_id)" @error="e => { const target = e.target as HTMLImageElement; if (target) target.src = defaultAvatar }" />
        <div class="text-col">
          <div class="username">{{ item.commenter.nickname }}</div>
          <div class="desc" v-if="item.comment.parent_id == 0">
            <span class="label">{{ t("user.messages.commentedText") }}</span>
            <span class="content">{{ stripTags(item.comment.content) }}</span>
          </div>
          <div class="desc" v-else-if="item.comment.parent_id > 0">
            <span class="label">{{ replyCommentText(item.comment.reply_to_nickname) }}</span>
            <span class="content">{{ stripTags(item.comment.content) }}</span>
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

// 「回复了[评论]：」→ 把各语言里的 [xx] 占位换成被回复人昵称（原来只替换英文的 [Comment]）
function replyCommentText(nickname: string) {
  return t("user.messages.replyComment").replace(/\[[^\]]*\]/, "[" + (nickname || "") + "]");
}
const router = useRouter();
defineProps<{ list: any[] }>();

// 评论内容只显示文字：去掉 <b> 这类标签（详情页用 v-html 渲染，这里是纯文本，不去的话标签会原样显示出来）
function stripTags(html: string): string {
  return String(html || "").replace(/<[^>]*>/g, "");
}

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
    router.push(`/detail/${post.post_id}?cid=${comment.comment_id}`);
  } else if (comment && comment.parent_id) {
    router.push(`/detail/${post.post_id}?cid=${comment.parent_id}&rid=${comment.comment_id}`);
  } else {
    router.push(`/detail/${post.post_id}`);
  }
}

function goUserHome(userId: string) {
  router.push(`/user-home/${userId}`);
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
  flex: 1 1 0; // 占满右侧作品框之外的宽度，不然左侧按文字长短撑开，竖线位置每条都不一样
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
  flex: 1 1 0; // 占满头像右边的宽度（评论内容要靠它撑开）
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
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #f5f5f5;
}
// 「评论了您的作品：」固定一行不换行、不被挤；评论内容占剩下的宽度，超出省略号
.label {
  flex-shrink: 0;
  white-space: nowrap;
  margin-right: 4px;
}
.content {
  flex: 1 1 auto;
  min-width: 0;
  contain: inline-size; // 不让这段不换行的长文字参与最小宽度计算，否则会把整个消息页撑出容器、窗口小时出横向滚动条
  max-width: 704px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  flex: 0 1 400px; // 右侧作品框窄一点，把宽度让给左侧评论文字
  max-width: 40%; // 卡片不够宽时右侧先让：左侧至少留 60%，不然日 / 韩 / 泰文的「评论了您的作品：」一长，评论内容就没地方显示了
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
  line-height: 20px;
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
    max-width: none;
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

@keyframes msgItemIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .msg-item { animation: none; }
}
</style>
