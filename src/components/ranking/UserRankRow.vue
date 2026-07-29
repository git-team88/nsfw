<template>
  <div class="mg-rk-row user-rank-row" :style="{ animationDelay: `${Math.min(i, 10) * 45}ms` }" @click="goUser">
    <span class="rank-number">{{ u.rank }}</span>
    <div class="user-rank-avatar">
      <img :src="u.avatar || defaultAvatar" alt="" @error="onErr" />
    </div>
    <div class="rank-info">
      <div class="rank-title">{{ u.name }}</div>
    </div>
    <div class="rank-stats">
      <span class="stat">
        <span class="stat-label">{{ t('rank.userFans') }}</span>
        <span class="stat-num stat-pink">{{ fmtK(u.fans) }}</span>
      </span>
      <span class="stat">
        <span class="stat-label">{{ t('rank.userWorks') }}</span>
        <span class="stat-num stat-blue">{{ fmtK(u.works) }}</span>
      </span>

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

const props = defineProps<{ u: RankedUser; i: number }>()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

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

.user-rank-row {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2.5px solid $ink;
  border-radius: 14px;
  gap: 14px;
  padding: 10px 20px;
  margin-bottom: 10px;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.1);
  cursor: pointer;
  will-change: transform;
}

.rank-number {
  width: 42px;
  height: 42px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(16, 24, 40, 0.06);
  border-radius: 12px;
  font-weight: 600;
  font-size: 20px;
  color: #99A1AF;
}

.user-rank-avatar {
  width: 54px;
  height: 54px;
  flex: none;
  border: 2px solid $ink;
  border-radius: 8px;
  overflow: hidden;
  background: #e7e1d8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-title {
  font-weight: 800;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-stats {
  display: flex;
  gap: 80px;
  flex: none;

  @media (max-width: 640px) {
    display: none;
  }
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  .stat-label {
    font-weight: 600;
    font-size: 13px;
    color: #6A7282;
  }

  .stat-num {
    font-weight: 800;
    font-size: 14px;

    &.stat-pink { color: #FF4D8D; }
    &.stat-blue { color: #3B82F6; }
  }
}

.user-follow-btn {
  flex: none;
  min-width: 88px;
  height: 40px;
  padding: 0 18px;
  border: 2px solid $ink;
  border-radius: 10px;
  background: #FF4D8D;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
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
