<template>
  <div class="mg-rk-row rank-row" :style="{ animationDelay: `${Math.min(i, 10) * 45}ms` }">
    <span class="rank-number">{{ w.rank }}</span>
    <div class="rank-cover" :style="{ background: w.cover }"></div>
    <div class="rank-info">
      <div class="rank-title">{{ w.title }}</div>
      <div class="rank-meta">
        <span class="type-badge" :style="{ background: badgeBg }">{{ typeLabel }}</span>
        <span class="rank-author">@{{ w.author }}</span>
        <span class="rank-change" :style="{ color: chgColor }">{{ chgText }}</span>
      </div>
    </div>
    <div class="rank-stats">
      <span class="stat stat-pink">&#9829; {{ fmtK(w.likes) }}</span>
      <span class="stat stat-comment">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        {{ fmtK(w.comments) }}
      </span>
      <span class="stat">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        {{ fmtKStr(w.views) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const TYPE_BADGE: Record<string, { label: string; bg: string }> = {
  manga: { label: 'rank.manga', bg: '#FFC24B' },
  novel: { label: 'rank.novel', bg: '#C9B6FF' },
  anime: { label: 'rank.anime', bg: '#7FD8E8' },
}

const props = defineProps<{ w: RankedWork; i: number }>()

const { t } = useI18n()

const badge = computed(() => TYPE_BADGE[props.w.type] ?? { label: 'rank.all', bg: '#eee' })
const badgeBg = computed(() => badge.value.bg)
const typeLabel = computed(() => t(badge.value.label))

function changeFor(id: string): { text: string; color: string } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const m = h % 3
  if (m === 0) return { text: `▲${(h % 4) + 1}`, color: '#22C55E' }
  if (m === 1) return { text: `▼${(h % 3) + 1}`, color: '#FF4D8D' }
  return { text: '±0', color: 'rgba(22,17,34,.4)' }
}

const chg = computed(() => changeFor(props.w.id))
const chgText = computed(() => chg.value.text)
const chgColor = computed(() => chg.value.color)

function fmtK(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function fmtKStr(s: string): string {
  const n = Number(s)
  return Number.isFinite(n) ? fmtK(n) : s
}
</script>

<style scoped lang="scss">
.rank-row {
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

.rank-cover {
  width: 58px;
  height: 78px;
  flex: none;
  border: 2px solid #161122;
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

.type-badge {
  border: 1.5px solid #161122;
  font-weight: 800;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
  color: #161122;
}

.rank-author {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.stat-comment {
  @media (max-width: 640px) {
    display: none;
  }
}
</style>
