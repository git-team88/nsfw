<template>
  <div class="mg-rk-row rank-row" :style="{ animationDelay: `${Math.min(i, 10) * 45}ms` }" @click="goDetail">
    <div class="rank-left">
      <span class="rank-number">{{ w.rank }}</span>
      <div class="rank-cover" :style="{ background: w.cover }"></div>
      <div class="rank-info">
        <div class="rank-title">{{ w.title }}</div>
        <div class="rank-meta">
          <span class="type-badge" :style="{ background: badgeBg }">{{ typeLabel }}</span>
        </div>
      </div>
    </div>

    <div class="rank-right">
      <div class="rank-author">
        <span class="rank-author-link" v-if="w.author" @click.stop="goUser">
          <img class="rank-avatar" :src="w.avatar || defaultAvatar" alt="" @error="onAvatarErr" />
          <span class="rank-author-name">{{ w.author }}</span>
        </span>
      </div>
      <div class="rank-stats">
        <span class="stat stat-pink">
          <img class="stat-icon" src="@/assets/images/rank/like.png" alt="" />
          {{ fmtK(w.likes) }}
        </span>
        <span class="stat stat-comment">
          <img class="stat-icon" src="@/assets/images/rank/comment.png" alt="" />
          {{ fmtK(w.comments) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import defaultAvatar from '@/assets/images/base/avatar.png'

interface RankedWork {
  id: string
  postId: string
  postIdNotNsfw: string
  title: string
  type: string
  author: string
  authorId: string
  avatar: string
  likes: number
  comments: number
  views: string
  cover: string
  coverUrl: string
  rank: number
}

// 类型标签配色（漫话=绿 / 漫剧=青 / 小说=紫）
const TYPE_BADGE: Record<string, { label: string; bg: string }> = {
  manga: { label: 'rank.manga', bg: '#8FE38C' },
  anime: { label: 'rank.anime', bg: '#7FD8E8' },
  novel: { label: 'rank.novel', bg: '#C9B6FF' },
}

const props = defineProps<{ w: RankedWork; i: number }>()

const { t } = useI18n()

const badge = computed(() => TYPE_BADGE[props.w.type] ?? { label: 'rank.all', bg: '#eee' })
const badgeBg = computed(() => badge.value.bg)
const typeLabel = computed(() => t(badge.value.label))

const router = useRouter()
function goDetail() {
  router.push(`/collection/${props.w.id}`)
}

// 点击作者头像/昵称跳转个人主页
function goUser() {
  if (props.w.authorId) router.push(`/user-home?id=${props.w.authorId}`)
}

function onAvatarErr(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.src = defaultAvatar
}

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<style scoped lang="scss">
.rank-row {
  display: flex;
  align-items: center;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  gap: 15px;
  padding: 12px 15px;
  margin-bottom: 11px;
  box-shadow: none;
  cursor: pointer;
  will-change: transform;
}

// 左：名次 + 封面 + 标题/标签
.rank-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 0;
}

.rank-number {
  width: 42px;
  height: 42px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  font-weight: 600;
  font-size: 18px;
  color: #777;
}

.rank-cover {
  width: 46px;
  height: 62px;
  flex: none;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-title {
  font-weight: 800;
  font-size: 15px;
  color: #f5f5f5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  min-width: 0;
  overflow: hidden;
  word-break: break-all;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  min-width: 0;
}

.type-badge {
  border: 1px solid #3d3d3d;
  font-weight: 800;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  flex-shrink: 0;
  color: #f5f5f5;
}

.rank-right{
  display: flex;
  flex: 0.7;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.rank-author {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  flex: 1;
  min-width: 0;
}

.rank-author-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  cursor: pointer;
}

.rank-avatar {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  border: 1px solid #3d3d3d;
  object-fit: cover;
}

.rank-author-name {
  font-weight: 600;
  font-size: 16px;
  color: #f5f5f5;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-stats {
  display: flex;
  gap: 18px;
  flex: none;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 800;
  font-size: 14px;
  color: #f5f5f5;
  white-space: nowrap;

  &.stat-pink {
    color: #ff4f9a;
    opacity: 1;
  }

  .stat-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
}
</style>