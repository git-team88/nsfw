<template>
  <div class="mg-rk-pod user-podium-card" :style="{ animationDelay: `${delay}ms` }" @click="goUser">
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
        <span class="stat stat-pink">&#9829; {{ fmtK(u.fans) }} {{ t('rank.userFans') }}</span>
        <span class="stat">{{ fmtK(u.works) }} {{ t('rank.userWorks') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import defaultAvatar from '@/assets/images/base/avatar.png'

interface RankedUser {
  id: string
  name: string
  avatar: string
  fans: number
  works: number
  rank: number
}

const PODIUM_COLORS = ['#FFD23F', '#E5E7EB', '#F0A85C']

const props = defineProps<{ u: RankedUser }>()
const { t } = useI18n()
const router = useRouter()

const badgeColor = computed(() => PODIUM_COLORS[props.u.rank - 1] ?? '#fff')
const delay = computed(() => props.u.rank === 1 ? 180 : props.u.rank === 2 ? 60 : 120)
// 领奖台错落：第1名卡片最高，第2名稍高，第3名正常（通过增加卡片自身高度实现）
const lift = computed(() => props.u.rank === 1 ? 44 : props.u.rank === 2 ? 22 : 0)

function goUser() {
  if (props.u.id) router.push(`/user-home?id=${props.u.id}`)
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
.user-podium-card {
  display: block;
  background: #fff;
  border: 3px solid #161122;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 5px 5px 0 rgba(22, 17, 34, 0.16);
  will-change: transform;
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
  left: 10px;
  top: 10px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2.5px solid #161122;
  font-family: "Mochiy Pop One", "M PLUS Rounded 1c", sans-serif;
  font-weight: 900;
  font-size: 18px;
  box-shadow: 2px 2px 0 #161122;
}

.user-podium-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  border: 3px solid #161122;
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
  padding: 0 13px 16px;
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
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 800;
  font-size: 12.5px;
  color: #161122;
  opacity: 0.7;
  white-space: nowrap;

  &.stat-pink {
    color: #FF4D8D;
    opacity: 1;
  }
}
</style>
