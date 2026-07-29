<template>
  <div class="mg-rk-pod user-podium-card" :class="`rank-${u.rank}`" :style="{ animationDelay: `${delay}ms` }" @click="goUser">
    <div class="user-podium-top" :style="{ paddingTop: `${26 + lift}px` }">
      <svg v-if="u.rank === 1" class="podium-crown" width="34" height="26" viewBox="0 0 24 20" fill="#FFD23F" stroke="#161122" stroke-width="1.8" stroke-linejoin="round">
        <path d="M2 6l4.5 4L12 2l5.5 8L22 6l-1.8 11H3.8z" />
      </svg>
      <span class="podium-badge" :style="{ background: badgeColor }">{{ u.rank }}</span>
      <div class="user-podium-avatar">
        <img :src="u.avatar || defaultAvatar" alt="" @error="onErr" />
      </div>
    </div>
    <div class="user-podium-info">
      <div class="user-podium-name">{{ u.name }}</div>
      <div class="user-podium-stats">
        <div class="stat-col">
          <span class="stat-num stat-pink">{{ fmtK(u.fans) }}</span>
          <span class="stat-label">{{ t('rank.userFans') }}</span>
        </div>
        <span class="stat-divider"></span>
        <div class="stat-col">
          <span class="stat-num stat-blue">{{ fmtK(u.works) }}</span>
          <span class="stat-label">{{ t('rank.userWorks') }}</span>
        </div>
      </div>
      <button
        class="user-follow-btn"
        :class="{ following: u.isFollowed }"
        @click.stop="toggleFollow"
      >
        {{ u.isFollowed ? t('home.followingBtn') : t('home.followBtn') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import defaultAvatar from '@/assets/images/base/avatar.png'
import api from '@/api/index'

interface RankedUser {
  id: string
  name: string
  avatar: string
  fans: number
  works: number
  rank: number
  isFollowed: boolean
}

const PODIUM_COLORS = ['#FFD347', '#C9D4E5', '#E8A87C']

const props = defineProps<{ u: RankedUser }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const badgeColor = computed(() => PODIUM_COLORS[props.u.rank - 1] ?? '#fff')
const delay = computed(() => props.u.rank === 1 ? 180 : props.u.rank === 2 ? 60 : 120)
// 领奖台错落：第1名卡片最高，第2名稍高，第3名正常（通过增加卡片自身高度实现）
const lift = computed(() => props.u.rank === 1 ? 44 : props.u.rank === 2 ? 22 : 0)

function goUser() {
  if (props.u.id) router.push(`/user-home?id=${props.u.id}`)
}

let following = false
async function toggleFollow() {
  if (!localStorage.getItem('token')) {
    localStorage.setItem('loginRedirect', route.fullPath)
    router.push('/register')
    return
  }
  if (following || !props.u.id) return
  following = true
  const data = { followed_id: props.u.id }
  try {
    if (props.u.isFollowed) {
      const res = (await api.unfollow(data)) as any
      if (res.code === 0 || res.code === 200) props.u.isFollowed = false
    } else {
      const res = (await api.follow(data)) as any
      if (res.code === 0 || res.code === 200) props.u.isFollowed = true
    }
  } catch (e) {
    console.error('toggleFollow', e)
  } finally {
    following = false
  }
}

function onErr(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.src = defaultAvatar
}

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<style scoped lang="scss">
$ink: #161122;

.user-podium-card {
  display: block;
  background: #fff;
  border: 3px solid $ink;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 6px 6px 0 rgba(22, 17, 34, 0.16);
  will-change: transform;

  // 黑色边框 + 名次色阴影（金/银/铜），与作品榜一致
  &.rank-1 { box-shadow: 6px 6px 0 #FFD347; }
  &.rank-2 { box-shadow: 6px 6px 0 #C9D4E5; }
  &.rank-3 { box-shadow: 6px 6px 0 #E8A87C; }
}

.user-podium-top {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 26px 0 14px;
}

.podium-crown {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 6px;
  z-index: 2;
  filter: drop-shadow(1px 2px 0 rgba(22, 17, 34, 0.3));
}

.podium-badge {
  position: absolute;
  left: 12px;
  top: 12px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 2.5px solid $ink;
  font-weight: 900;
  font-size: 18px;
}

.user-podium-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 3px solid $ink;
  overflow: hidden;
  background: #e7e1d8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.user-podium-info {
  padding: 0 16px 16px;
  text-align: center;
}

.user-podium-name {
  font-weight: 800;
  font-size: 15px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-podium-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 0 14px;
}

.stat-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.stat-num {
  font-weight: 800;
  font-size: 16px;
  line-height: 1;

  &.stat-pink { color: #FF4D8D; }
  &.stat-blue { color: #3B82F6; }
}

.stat-label {
  font-weight: 600;
  font-size: 12px;
  color: #6A7282;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(22, 17, 34, 0.12);
  flex: none;
}

.user-follow-btn {
  width: 100%;
  height: 48px;
  border: 2px solid $ink;
  border-radius: 10px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 $ink;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease-out;

  &.following {
    background: #fff;
    color: $ink;
  }

  &:hover {
    transform: translate(-1px, -2px);
    box-shadow: 4px 5px 0 $ink;
  }

  &:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0 $ink;
  }
}
</style>
