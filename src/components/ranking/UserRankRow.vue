<template>
  <div class="mg-rk-row user-rank-row" :style="{ animationDelay: `${Math.min(i, 10) * 45}ms` }" @click="goUser">
    <span class="rank-number">{{ u.rank }}</span>
    <div class="user-rank-avatar">
      <img :src="u.avatar || defaultAvatar" alt="" @error="onErr" />
    </div>
    <div class="rank-info">
      <div class="rank-title">{{ u.name }}</div>
      <div class="rank-meta">
        <span class="rank-change" :style="{ color: chgColor }">{{ chgText }}</span>
      </div>
    </div>
    <div class="rank-stats">
      <span class="stat stat-pink">&#9829; {{ fmtK(u.fans) }} {{ t('rank.userFans') }}</span>
      <span class="stat">{{ fmtK(u.works) }} {{ t('rank.userWorks') }}</span>
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

const props = defineProps<{ u: RankedUser; i: number }>()
const { t } = useI18n()
const router = useRouter()

function goUser() {
  if (props.u.id) router.push(`/user-home?id=${props.u.id}`)
}

function onErr(e: Event) {
  const el = e.target as HTMLImageElement
  if (el) el.src = defaultAvatar
}

function changeFor(id: string): { text: string; color: string } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const m = h % 3
  if (m === 0) return { text: `▲${(h % 4) + 1}`, color: '#22C55E' }
  if (m === 1) return { text: `▼${(h % 3) + 1}`, color: '#FF4D8D' }
  return { text: '±0', color: 'rgba(22,17,34,.4)' }
}

const chg = computed(() => changeFor(props.u.id))
const chgText = computed(() => chg.value.text)
const chgColor = computed(() => chg.value.color)

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<style scoped lang="scss">
.user-rank-row {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2.5px solid #161122;
  border-radius: 14px;
  gap: 15px;
  padding: 12px 15px;
  margin-bottom: 11px;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.1);
  cursor: pointer;
  will-change: transform;
}

.rank-number {
  width: 32px;
  flex: none;
  text-align: center;
  font-family: "Mochiy Pop One", "M PLUS Rounded 1c", sans-serif;
  font-weight: 900;
  font-size: 26px;
  opacity: 0.4;
}

.user-rank-avatar {
  width: 54px;
  height: 54px;
  flex: none;
  border: 2px solid #161122;
  border-radius: 50%;
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

.rank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  min-width: 0;
}

.rank-change {
  font-weight: 800;
  font-size: 11px;
  flex-shrink: 0;
}

.rank-stats {
  display: flex;
  gap: 14px;
  flex: none;
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
