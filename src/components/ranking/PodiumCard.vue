<template>
  <div class="mg-rk-pod podium-card" :class="`rank-${w.rank}`" :style="{ animationDelay: `${delay}ms` }" @click="goDetail">
    <div class="podium-cover">
      <div class="mg-rk-cover-bg podium-cover-bg" :style="{ background: w.cover }"></div>
      <svg v-if="w.rank === 1" class="podium-crown" width="30" height="24" viewBox="0 0 24 20" fill="#FFD23F" stroke="#161122" stroke-width="1.8" stroke-linejoin="round">
        <path d="M2 6l4.5 4L12 2l5.5 8L22 6l-1.8 11H3.8z" />
      </svg>
      <span class="podium-badge" :style="{ background: badgeColor }">{{ w.rank }}</span>
    </div>

    <div class="podium-info">
      <div class="podium-top">
        <div class="podium-author" v-if="w.author" @click.stop="goUser">
          <img class="podium-avatar" :src="w.avatar || defaultAvatar" alt="" @error="onAvatarErr" />
          <span class="podium-author-name">{{ w.author }}</span>
        </div>
        <div class="podium-title">{{ w.title }}</div>
        <div class="podium-tags">
          <span class="type-badge" :style="{ background: typeBg }">{{ typeLabel }}</span>
        </div>
      </div>
      <div class="podium-stats">
        <span class="stat stat-pink">
          <img class="stat-icon" src="@/assets/images/rank/like.png" alt="" />
          {{ fmtK(w.likes) }}
        </span>
        <span class="stat">
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

// 名次角标底色（①金 ②银 ③铜）
const PODIUM_COLORS = ['#FFD347', '#C9D4E5', '#E8A87C']

// 类型标签配色（漫话=绿 / 漫剧=青 / 小说=紫）
const TYPE_BADGE: Record<string, { label: string; bg: string }> = {
  manga: { label: 'rank.manga', bg: '#8FE38C' },
  anime: { label: 'rank.anime', bg: '#7FD8E8' },
  novel: { label: 'rank.novel', bg: '#C9B6FF' },
}

const props = defineProps<{ w: RankedWork }>()
const { t } = useI18n()
const router = useRouter()

function goDetail() {
  // 根据是否开启敏感内容读取不同的 post id
  const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1'
  const pid = (allowSensitive ? props.w.postId : props.w.postIdNotNsfw) || props.w.postId || props.w.postIdNotNsfw
  if (pid) router.push(`/detail?id=${pid}`)
}

// 点击作者头像/昵称跳转个人主页
function goUser() {
  if (props.w.authorId) router.push(`/user-home?id=${props.w.authorId}`)
}

function onAvatarErr(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.src = defaultAvatar
}

const badgeColor = computed(() => PODIUM_COLORS[props.w.rank - 1] ?? '#fff')
const typeInfo = computed(() => TYPE_BADGE[props.w.type] ?? { label: 'rank.all', bg: '#eee' })
const typeBg = computed(() => typeInfo.value.bg)
const typeLabel = computed(() => t(typeInfo.value.label))
const delay = computed(() => (props.w.rank - 1) * 90)

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<style scoped lang="scss">
$ink: #161122;

.podium-card {
  display: flex;
  gap: 12px;
  background: #fff;
  border: 3px solid $ink;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 6px 6px 0 rgba(22, 17, 34, 0.16);
  will-change: transform;

  // 黑色边框 + 名次色阴影
  &.rank-1 { box-shadow: 6px 6px 0 #FFD347; }
  &.rank-2 { box-shadow: 6px 6px 0 #C9D4E5; }
  &.rank-3 { box-shadow: 6px 6px 0 #E8A87C; }
}

// 前 3 名封面尺寸错落（名次越高越大）
.rank-1 .podium-cover { width: 166px; height: 220px; }
.rank-2 .podium-cover { width: 158px; height: 210px; }
.rank-3 .podium-cover { width: 150px; height: 200px; }

.podium-cover {
  position: relative;
  flex: none;
  width: 158px;
  height: 200px;
  overflow: hidden;
}

.podium-cover-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.podium-crown {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 4px;
  z-index: 2;
  filter: drop-shadow(1px 2px 0 rgba(22, 17, 34, 0.3));
}

.podium-badge {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 2px solid $ink;
  font-weight: 900;
  font-size: 18px;
}

.podium-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  padding: 14px 14px 14px 0;
}

// 上方三块（作者/标题/标签）成组，与底部统计两端对齐
.podium-top {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.podium-author {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  cursor: pointer;
}

.podium-avatar {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  border: 2px solid $ink;
  object-fit: cover;
}

.podium-author-name {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-title {
  font-weight: bold;
  font-size: 16px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.podium-tags {
  display: flex;
  gap: 8px;
}

.type-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  border: 2px solid $ink;
  font-weight: 600;
  font-size: 12px;
  padding: 3px 12px;
  border-radius: 8px;
  color: $ink;
  line-height: 1;
}

.podium-stats {
  display: flex;
  gap: 14px;
  margin-top: 2px;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 800;
  font-size: 14px;
  color: $ink;
  white-space: nowrap;

  &.stat-pink {
    color: #FF4D8D;
    opacity: 1;
  }

  .stat-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
}

// 小屏（≤1000 单列一行一个）：封面保持固定宽度，无需调整
@media (max-width: 1000px) {
  .podium-cover {
    width: 112px;
    flex: none;
  }
}
</style>
