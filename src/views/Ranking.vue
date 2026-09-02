<template>
  <div class="ranking-page">
    <Header :cur="3" @user-info-loaded="handleUserInfoLoaded" @balance-info-loaded="handleBalanceInfoLoaded" />

    <main class="ranking-shell">
      <section class="ranking-panel">
        <div class="ranking-header">
          <div class="ranking-header-left">
            <h1 class="ranking-title">
              <img class="ranking-title-icon" src="@/assets/images/rank/icon.png" alt="" />
              <span>{{ t('rank.title') }}</span>
            </h1>
            <p class="ranking-sub">{{ t('rank.sub') }}</p>
          </div>

          <div class="ranking-header-right">
            <div class="ranking-note">
              <span>{{ t('rank.statNote') }}</span>
              <span>{{ t('rank.updateNote') }}</span>
            </div>
          </div>
        </div>

        <div class="ranking-filters">
          <div class="seg-group">
            <button
              v-for="m in modes"
              :key="m.id"
              class="seg-btn"
              :class="{ active: mode === m.id }"
              @click="mode = m.id"
            >
              {{ t(m.label) }}
            </button>
          </div>

          <!-- 作品排行：内容类型 -->
          <div class="type-pills" v-if="mode === 'work'">
            <button
              v-for="tp in types"
              :key="tp.id"
              class="type-pill"
              :class="{ active: type === tp.id }"
              @click="type = tp.id"
            >
              {{ t(tp.label) }}
            </button>
          </div>

          <!-- 用户排行：人气 / 新锐 -->
          <div class="type-pills" v-else>
            <button
              v-for="ut in userTabs"
              :key="ut.id"
              class="type-pill"
              :class="{ active: userTab === ut.id }"
              @click="userTab = ut.id"
            >
              {{ t(ut.label) }}
            </button>
          </div>

          <div class="ranking-deco" aria-hidden="true">
            <span v-for="n in 15" :key="n"></span>
          </div>
        </div>

        <!-- 作品排行 -->
        <template v-if="mode === 'work'">
          <div v-if="workLoading" class="ranking-loading">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('rank.loading') }}</span>
          </div>
          <template v-else-if="workItems.length > 0">
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

            <div v-if="workLoadingMore" class="ranking-loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">{{ t('rank.loading') }}</span>
            </div>
            <div v-else-if="!workHasMore" class="ranking-nomore">{{ t('rank.noMore') }}</div>
          </template>
          <EmptyState v-else :text="t('rank.empty')" />
        </template>

        <!-- 用户排行 -->
        <template v-else>
          <div v-if="userLoading" class="ranking-loading">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ t('rank.loading') }}</span>
          </div>
          <template v-else-if="userItems.length > 0">
            <div class="ranking-podium" v-if="userTop3.length > 0">
              <UserPodiumCard
                v-for="u in userPodiumOrder"
                :key="u.id"
                :u="u"
              />
            </div>

            <UserRankRow
              v-for="(u, i) in userRestItems"
              :key="u.id"
              :u="u"
              :i="i"
            />

            <div v-if="userLoadingMore" class="ranking-loading">
              <div class="loading-spinner"></div>
              <span class="loading-text">{{ t('rank.loading') }}</span>
            </div>
            <div v-else-if="!userHasMore" class="ranking-nomore">{{ t('rank.noMore') }}</div>
          </template>
          <EmptyState v-else :text="t('rank.empty')" />
        </template>
      </section>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import PodiumCard from '@/components/ranking/PodiumCard.vue'
import RankRow from '@/components/ranking/RankRow.vue'
import UserPodiumCard from '@/components/ranking/UserPodiumCard.vue'
import UserRankRow from '@/components/ranking/UserRankRow.vue'
import EmptyState from '@/components/EmptyState.vue'
import api from '@/api/index'
import { useContentSwitchStore } from '@/stores/contentSwitch'
import { toast } from '@/util/toast'

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

interface RankedUser {
  id: string
  name: string
  avatar: string
  fans: number
  works: number
  rank: number
  isFollowed: boolean
}

const { t, locale } = useI18n()
const contentSwitch = useContentSwitchStore()
const route = useRoute()
const router = useRouter()

// 敏感内容地区判断：进入页面时拉一次，作品榜据此决定 show_nsfw
const userRegion = ref(false)
let regionFetched = false
async function getCountry() {
  if (regionFetched) return
  try {
    const res = (await api.getCode()) as any
    regionFetched = true
    userRegion.value = res.code == 0 && res.data?.countryCode !== 'CN'
  } catch {
    regionFetched = true
    userRegion.value = false
  }
}

const mode = ref<'work' | 'user'>('work')
const type = ref('all')
const userTab = ref<'popular' | 'rising'>('popular')

const modes = [
  { id: 'work' as const, label: 'rank.workRank' },
  { id: 'user' as const, label: 'rank.userRank' },
]

const userTabs = [
  { id: 'popular' as const, label: 'rank.popularAuthor' },
  { id: 'rising' as const, label: 'rank.risingAuthor' },
]

const types = [
  { id: 'all', label: 'rank.all' },
  { id: 'manga', label: 'rank.manga' },
  { id: 'novel', label: 'rank.novel' },
]

// ---------- 作品排行（真实数据，分页 + 下拉加载） ----------
// 类型筛选 -> 接口 type 参数：0全部 / 1漫话 / 2小说
const TYPE_PARAM: Record<string, number> = { all: 0, manga: 1, novel: 2 }
// 接口 type 数值 -> 卡片类型标签 key
const TYPE_KEY: Record<string, string> = { '1': 'manga', '2': 'novel' }

const workItems = ref<RankedWork[]>([])
const workLoading = ref(false)      // 首屏加载
const workLoadingMore = ref(false)  // 加载下一页
const workPage = ref(1)
const workHasMore = ref(true)
const WORK_LIMIT = 50

async function loadWorkRank(reset = false) {
  if (reset) {
    workPage.value = 1
    workHasMore.value = true
    workItems.value = []
    workLoading.value = true
  } else {
    if (workLoadingMore.value || !workHasMore.value || workLoading.value) return
    workLoadingMore.value = true
  }
  const page = workPage.value
  const reqType = type.value
  try {
    await contentSwitch.ensureLoaded()
    const res = (await api.popularBookRank(page, WORK_LIMIT, 'week', TYPE_PARAM[reqType] ?? 0, locale.value === 'zh' ? 'cn' : locale.value, contentSwitch.showNsfw, contentSwitch.channel)) as any
    // 请求期间切换了筛选类型则丢弃本次结果
    if (reqType !== type.value || mode.value !== 'work') return
    const list = ((res.code === 0 || res.code === 200) && (res.data?.data || res.data)) || []
    const mapped: RankedWork[] = (Array.isArray(list) ? list : []).map((it: any, i: number) => {
      const b = it.book || {}
      return {
        id: String(it.book_id ?? b.id ?? ''),
        postId: String(b.public_post_id ?? ''),
        postIdNotNsfw: String(b.public_post_id_not_nsfw ?? ''),
        title: b.title || '',
        type: TYPE_KEY[String(b.type)] ?? 'manga',
        author: it.user?.nickname ?? '',
        authorId: String(b.user_id ?? it.user_id ?? it.user?.id ?? ''),
        avatar: it.user?.avatar || '',
        likes: Number(it.like_count ?? it.all_like ?? it.like_num ?? 0) || 0,
        comments: Number(it.comment_count ?? it.all_comment ?? it.comment_num ?? 0) || 0,
        views: String(it.all_view ?? it.view_num ?? ''),
        cover: b.cover ? `url(${b.cover}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        coverUrl: b.cover || '',
        rank: Number(it.rank) || ((page - 1) * WORK_LIMIT + i + 1),
      }
    })
    if (reset) workItems.value = mapped
    else workItems.value.push(...mapped)
    workHasMore.value = mapped.length >= WORK_LIMIT
    if (workHasMore.value) workPage.value = page + 1
  } catch (e) {
    console.error('popularBookRank', e)
    if (reset) workItems.value = []
    workHasMore.value = false
  } finally {
    workLoading.value = false
    workLoadingMore.value = false
  }
}

const top3 = computed(() => workItems.value.slice(0, 3))
const restItems = computed(() => workItems.value.slice(3))

const podiumOrder = computed(() => {
  // 领奖台顺序：左=第2名，中=第1名，右=第3名
  if (top3.value.length === 3) {
    return [top3.value[1], top3.value[0], top3.value[2]]
  }
  return top3.value
})

// ---------- 用户排行（真实数据，分页） ----------
const userItems = ref<RankedUser[]>([])
const userLoading = ref(false)       // 首屏加载
const userLoadingMore = ref(false)   // 加载下一页
const userPage = ref(1)
const userHasMore = ref(true)
const USER_LIMIT = 50

async function loadUserRank(reset = false) {
  if (reset) {
    userPage.value = 1
    userHasMore.value = true
    userItems.value = []
    userLoading.value = true
  } else {
    if (userLoadingMore.value || !userHasMore.value || userLoading.value) return
    userLoadingMore.value = true
  }
  const page = userPage.value
  const reqUserTab = userTab.value
  try {
    await contentSwitch.ensureLoaded()
    // 人气作者榜 / 新锐作者榜，均使用 period=week
    const period = 'week'
    const showNsfw = contentSwitch.showNsfw
    const res = (reqUserTab === 'rising'
      ? await api.risingUserRank(page, USER_LIMIT, period, showNsfw, contentSwitch.channel)
      : await api.popularUserRank(page, USER_LIMIT, period, showNsfw, contentSwitch.channel)) as any
    // 请求期间切换了子榜/主榜则丢弃本次结果
    if (reqUserTab !== userTab.value || mode.value !== 'user') return
    if (res.code !== 0 && res.code !== 200) {
      toast((locale.value === 'en' ? res.msg : locale.value === 'zh' ? res.msg_cn : locale.value === 'tc' ? res.msg_tc : res.msg_jp) || t('fail'))
    }
    const list = ((res.code === 0 || res.code === 200) && res.data?.data) ? res.data.data : []
    const mapped: RankedUser[] = list.map((it: any, i: number) => ({
      id: String(it.user_id),
      name: it.user?.nickname ?? '',
      avatar: it.user?.avatar || '',
      fans: Number(it.fans_num) || 0,
      works: Number(it.post_num) || 0,
      rank: (page - 1) * USER_LIMIT + i + 1,
      isFollowed: it.is_follow == 1 || it.is_followed == 1 || it.user?.is_follow == 1,
    }))
    if (reset) userItems.value = mapped
    else userItems.value.push(...mapped)
    userHasMore.value = list.length >= USER_LIMIT
    if (userHasMore.value) userPage.value = page + 1
  } catch (e) {
    console.error('popularUserRank', e)
    toast(t('fail'))
    if (reset) userItems.value = []
    userHasMore.value = false
  } finally {
    userLoading.value = false
    userLoadingMore.value = false
  }
}

const userTop3 = computed(() => userItems.value.slice(0, 3))
const userRestItems = computed(() => userItems.value.slice(3))
const userPodiumOrder = computed(() => {
  if (userTop3.value.length === 3) {
    return [userTop3.value[1], userTop3.value[0], userTop3.value[2]]
  }
  return userTop3.value
})

// 切主 tab 后回到第一个 subtab
watch(mode, (m) => {
  if (m === 'work' && route.query.tab) {
    router.replace({ path: route.path, query: {} })
  }
  type.value = 'all'
  const prevUserTab = userTab.value
  userTab.value = 'popular'
  if (m === 'work') {
    loadWorkRank(true)
  } else if (m === 'user' && prevUserTab === 'popular') {
    loadUserRank(true)
  }
})

// 作品排行：切换类型重新加载
watch(type, () => {
  if (mode.value === 'work') loadWorkRank(true)
})

watch(userTab, () => {
  if (mode.value === 'user') loadUserRank(true)
})

// 切换语言时重新请求作品榜（popularBookRank 依赖 locale；用户榜接口不带 locale，无需重取）
watch(locale, () => {
  if (mode.value === 'work') loadWorkRank(true)
})

// 下拉到底部加载下一页
function onScroll() {
  const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 320
  if (!nearBottom) return
  if (mode.value === 'work') {
    if (workLoading.value || workLoadingMore.value || !workHasMore.value) return
    loadWorkRank(false)
  } else {
    if (userLoading.value || userLoadingMore.value || !userHasMore.value) return
    loadUserRank(false)
  }
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  // 从首页「查看全部」进入时先同步切换 mode，避免首屏闪现「无数据」
  if (route.query.tab === 'user') {
    mode.value = 'user'
    userLoading.value = true
  } else {
    workLoading.value = true
  }
  // 进入页面先拿地区，保证作品榜首屏请求带上正确的 show_nsfw
  await getCountry()
  // mode 已提前设置，watch(mode) 不会重复触发（因为值未变），这里手动首屏加载
  if (mode.value === 'work') {
    loadWorkRank(true)
  } else {
    loadUserRank(true)
  }
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

function handleUserInfoLoaded() {}
function handleBalanceInfoLoaded() {}
</script>

<style scoped lang="scss">
@use '@/scss/Ranking.scss';
</style>
