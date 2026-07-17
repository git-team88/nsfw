<template>
  <div class="ranking-page">
    <Header :cur="3" @user-info-loaded="handleUserInfoLoaded" @balance-info-loaded="handleBalanceInfoLoaded" />

    <main class="ranking-shell">
      <section class="ranking-panel">
        <div class="ranking-header">
          <div class="ranking-header-left">
            <h1 class="ranking-title">{{ t('rank.title') }}</h1>
            <p class="ranking-sub">{{ t('rank.sub') }}</p>
          </div>
        </div>

        <div class="ranking-filters">
          <div class="seg-group">
            <button
              v-for="p in periods"
              :key="p.id"
              class="seg-btn"
              :class="{ active: period === p.id }"
              @click="period = p.id"
            >
              {{ t(p.label) }}
            </button>
          </div>

          <div class="seg-group">
            <button
              v-for="tp in types"
              :key="tp.id"
              class="seg-btn"
              :class="{ active: type === tp.id }"
              @click="type = tp.id"
            >
              {{ t(tp.label) }}
            </button>
          </div>
        </div>

        <template v-if="filteredItems.length > 0">
          <div class="ranking-podium" v-if="top3.length > 0">
            <PodiumCard
              v-for="w in podiumOrder"
              :key="w.id"
              :w="w"
            />
          </div>

          <RankRow
            v-for="(w, i) in restItems"
            :key="w.id"
            :w="w"
            :i="i"
          />
        </template>

        <div v-else class="ranking-empty">{{ t('rank.empty') }}</div>
      </section>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Header from '@/components/Header.vue'
import PodiumCard from '@/components/ranking/PodiumCard.vue'
import RankRow from '@/components/ranking/RankRow.vue'

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

const { t } = useI18n()

const period = ref('daily')
const type = ref('all')

const periods = [
  { id: 'daily', label: 'rank.daily' },
  { id: 'weekly', label: 'rank.weekly' },
  { id: 'monthly', label: 'rank.monthly' },
]

const types = [
  { id: 'all', label: 'rank.all' },
  { id: 'manga', label: 'rank.manga' },
  { id: 'novel', label: 'rank.novel' },
  { id: 'anime', label: 'rank.anime' },
]

const fakeData: RankedWork[] = [
  { id: 'rk-001', title: '星の降る夜に', type: 'novel', author: 'sakura', likes: 2340, comments: 456, views: '12500', cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', rank: 1 },
  { id: 'rk-002', title: '龍の騎士団', type: 'manga', author: 'ryuken', likes: 1890, comments: 321, views: '9800', cover: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', rank: 2 },
  { id: 'rk-003', title: '桜花戦記', type: 'anime', author: 'hana_s', likes: 1560, comments: 289, views: '7600', cover: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', rank: 3 },
  { id: 'rk-004', title: '月影の迷宮', type: 'novel', author: 'tsukiyo', likes: 1320, comments: 245, views: '6400', cover: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', rank: 4 },
  { id: 'rk-005', title: '炎の守護者', type: 'manga', author: 'honoo_k', likes: 1100, comments: 198, views: '5300', cover: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', rank: 5 },
  { id: 'rk-006', title: '深海の楽園', type: 'anime', author: 'umi_d', likes: 980, comments: 176, views: '4200', cover: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', rank: 6 },
  { id: 'rk-007', title: '風の歌を聴け', type: 'novel', author: 'kaze_m', likes: 870, comments: 153, views: '3800', cover: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', rank: 7 },
  { id: 'rk-008', title: '銀河の約束', type: 'manga', author: 'ginga_p', likes: 760, comments: 134, views: '3200', cover: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', rank: 8 },
  { id: 'rk-009', title: '雪国物語', type: 'anime', author: 'yuki_t', likes: 650, comments: 112, views: '2700', cover: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', rank: 9 },
  { id: 'rk-010', title: '虹の彼方に', type: 'novel', author: 'niji_w', likes: 540, comments: 98, views: '2200', cover: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', rank: 10 },
  { id: 'rk-011', title: '暗夜の剣士', type: 'manga', author: 'kiri_s', likes: 430, comments: 82, views: '1800', cover: 'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)', rank: 11 },
  { id: 'rk-012', title: '花鳥風月', type: 'anime', author: 'kacho_f', likes: 380, comments: 67, views: '1500', cover: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', rank: 12 },
  { id: 'rk-013', title: '天界の扉', type: 'novel', author: 'tenka_g', likes: 320, comments: 56, views: '1300', cover: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', rank: 13 },
  { id: 'rk-014', title: '鬼神伝', type: 'manga', author: 'kijin_r', likes: 280, comments: 48, views: '1100', cover: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', rank: 14 },
  { id: 'rk-015', title: '光の記憶', type: 'anime', author: 'hikari_n', likes: 240, comments: 39, views: '950', cover: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', rank: 15 },
]

const filteredItems = computed(() => {
  if (type.value === 'all') return fakeData
  return fakeData.filter(w => w.type === type.value)
})

const top3 = computed(() => filteredItems.value.slice(0, 3))
const restItems = computed(() => filteredItems.value.slice(3))

const podiumOrder = computed(() => {
  if (top3.value.length === 3) {
    return [top3.value[1], top3.value[0], top3.value[2]]
  }
  return top3.value
})

function handleUserInfoLoaded() {}
function handleBalanceInfoLoaded() {}
</script>

<style scoped lang="scss">
@use '@/scss/Ranking.scss';
</style>
