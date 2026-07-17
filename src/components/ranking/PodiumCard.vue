<template>
  <div class="mg-rk-pod podium-card" :style="{ animationDelay: `${delay}ms` }">
    <div class="podium-cover">
      <div class="mg-rk-cover-bg podium-cover-bg" :style="{ background: w.cover }"></div>
      <svg v-if="w.rank === 1" class="podium-crown" width="34" height="26" viewBox="0 0 24 20" fill="#FFD23F" stroke="#161122" stroke-width="1.8" stroke-linejoin="round">
        <path d="M2 6l4.5 4L12 2l5.5 8L22 6l-1.8 11H3.8z" />
      </svg>
      <span class="podium-badge" :style="{ background: badgeColor }">{{ w.rank }}</span>
    </div>
    <div class="podium-info">
      <div class="podium-title">{{ w.title }}</div>
      <div class="podium-author">@{{ w.author }}</div>
      <div class="podium-stats">
        <span class="stat stat-pink">&#9829; {{ fmtK(w.likes) }}</span>
        <span class="stat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          {{ fmtKStr(w.views) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface RankedWork {
  id: string
  title: string
  type: string
  author: string
  likes: number
  comments: number
  views: string
  cover: string
  rank: number
}

const PODIUM_COLORS = ['#FFD23F', '#E5E7EB', '#F0A85C']

const props = defineProps<{ w: RankedWork }>()

const badgeColor = computed(() => PODIUM_COLORS[props.w.rank - 1] ?? '#fff')
const delay = computed(() => props.w.rank === 1 ? 180 : props.w.rank === 2 ? 60 : 120)

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function fmtKStr(s: string): string {
  const n = Number(s)
  return Number.isFinite(n) ? fmtK(n) : s
}
</script>

<style scoped lang="scss">
.podium-card {
  display: block;
  background: #fff;
  border: 3px solid #161122;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 5px 5px 0 rgba(22, 17, 34, 0.16);
  will-change: transform;
}

.podium-cover {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
}

.podium-cover-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
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

.podium-info {
  padding: 13px 13px 15px;
}

.podium-title {
  font-weight: 800;
  font-size: 14.5px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-author {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  margin: 2px 0 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-stats {
  display: flex;
  gap: 12px;
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
