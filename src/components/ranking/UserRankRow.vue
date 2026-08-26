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
        :class="{ following: u.isFollowed, 'is-placeholder': isSelf }"
        @click.stop="isSelf ? null : toggleFollow()"
      >
        <span class="btn-text">{{ u.isFollowed ? t('home.followingBtn') : t('home.followBtn') }}</span>
        <span class="hover-text" v-if="u.isFollowed">{{ t('home.user.unfollow') }}</span>
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
import { toast } from '@/util/toast'

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
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

// 是否为当前登录用户自己（自己不显示关注按钮）
const isSelf = computed(() => {
  const uid = localStorage.getItem('uid')
  return !!uid && String(props.u.id) === String(uid)
})

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
      if (res.code === 0 || res.code === 200) {
        props.u.isFollowed = false
        toast(t('success'))
      } else {
        toast(localeMsg(res))
      }
    } else {
      const res = (await api.follow(data)) as any
      if (res.code === 0 || res.code === 200) {
        props.u.isFollowed = true
        toast(t('success'))
      } else {
        toast(localeMsg(res))
      }
    }
  } catch (e) {
    console.error('toggleFollow', e)
    toast(t('fail'))
  } finally {
    following = false
  }
}

// 按语言取后端返回的提示文案
function localeMsg(res: any): string {
  return locale.value === 'en' ? res.msg : locale.value === 'zh' ? res.msg_cn : locale.value === 'tc' ? res.msg_tc : res.msg_jp
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
.user-rank-row {
  display: flex;
  align-items: center;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 14px;
  gap: 14px;
  padding: 10px 20px;
  margin-bottom: 10px;
  box-shadow: none;
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
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  font-weight: 600;
  font-size: 18px;
  color: #777;
}

.user-rank-avatar {
  width: 54px;
  height: 54px;
  flex: none;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  overflow: hidden;
  background: #2c2c2c;

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
  width: 100%;
  font-weight: 800;
  font-size: 15px;
  color: #f5f5f5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-stats {
  display: flex;
  gap: 80px;

  @media (max-width: 640px) {
    gap: 14px;
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
    color: #777;
  }

  .stat-num {
    font-weight: 800;
    font-size: 14px;

    &.stat-pink { color: #ff4f9a; }
    &.stat-blue { color: #3B82F6; }
  }
}

.user-follow-btn {
  flex: none;
  min-width: 88px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid #3d3d3d;
  border-radius: 10px;
  background: linear-gradient(135deg, #ff4f9a, #ff2d7f);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  box-shadow: none;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease-out;

  .hover-text { display: none; }

  // 自己的账号：保留占位但不可见，避免统计信息错位
  &.is-placeholder {
    visibility: hidden;
    pointer-events: none;
  }

  &.following {
    background: #1a1a1a;
    color: #f5f5f5;
  }

  // 已关注时悬浮显示「取消关注」
  &.following:hover {
    background: rgba(255,79,154,0.12);
    color: #ff4f9a;
    border-color: #ff4f9a;

    .btn-text { display: none; }
    .hover-text { display: inline; }
  }

  &:hover {
    box-shadow: 0 0 28px rgba(255, 50, 140, 0.65);
  }

  &:active {
    box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  }
}
</style>