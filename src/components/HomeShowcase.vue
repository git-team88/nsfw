<template>
  <section class="mg-split">
    <!-- LEFT: 推荐创作者 3D 深度堆叠 -->
    <div class="cre-panel">
      <div class="sec-fx">
        <img v-for="fx in CRE_FX" :key="fx.slug" class="mg-seceffect" :src="`/effects/${fx.slug}.png`" alt="" :style="fx.style" />
      </div>
      <div class="panel-head">
        <h2 class="panel-title">{{ t('home.popularCreator') }}</h2>
        <div class="flex-1"></div>
        <button class="head-more" @click="goRankUser">{{ t('home.viewAll') }} →</button>
      </div>
      <p class="panel-sub">{{ t('home.popularCreatorSub') }}</p>

      <div
        ref="creLayer"
        class="mg-crelayer"
        @pointermove="onCreMove"
        @pointerleave="setHover(null)"
      >
        <div
          v-for="(c, i) in creators"
          :key="c.id"
          :ref="el => setCardEl(i, el as HTMLElement)"
          data-card
          role="link"
          :aria-label="c.name"
          class="cre-card"
          :style="{ boxShadow: `7px 7px 0 ${c.cover}` }"
          @click="goUser(c)"
        >
          <div class="cre-avatar" :style="{ background: c.avatar }">
            <img v-if="c.avatarImg" :src="c.avatarImg" alt="" draggable="false" class="mg-avimg" @error="onAvatarErr" />
          </div>
          <div class="cre-name">{{ c.name }}</div>
          <div class="cre-meta">{{ t('home.fansLabel') }} {{ c.fans }} · {{ t('home.worksLabel') }} {{ c.works }}</div>
          <button
            class="cre-follow"
            :class="{ following: c.isFollowed }"
            @click.stop="toggleFollow(c)"
          >{{ c.isFollowed ? t('home.followingBtn') : t('home.followBtn') }}</button>
        </div>

        <!-- sprout: 前卡弹开时从后面露出的漫画封面（门开效果） -->
        <div
          ref="sproutEl"
          role="link"
          tabindex="-1"
          class="cre-sprout"
          @click="goSprout"
        >
          <div ref="sproutCoverEl" class="sprout-cover"></div>
          <div class="sprout-badge">{{ t('home.latestWork') }}</div>
        </div>
      </div>
    </div>

    <!-- RIGHT: 人气作品 3D 环形 / 双排跑马灯 -->
    <div class="pop-panel">
      <div class="sec-fx">
        <img v-for="fx in POP_FX" :key="fx.slug" class="mg-seceffect" :src="`/effects/${fx.slug}.png`" alt="" :style="fx.style" />
      </div>
      <div class="panel-head">
        <h2 class="panel-title">{{ t('home.popularBook') }}</h2>
        <button class="head-more" @click="goRankWork">{{ t('home.seeMore') }} →</button>
        <button class="view-toggle" @click="view = view === 'ring' ? 'rows' : 'ring'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
          {{ view === 'ring' ? t('home.viewList') : t('home.viewRing') }}
        </button>
        <div class="flex-1"></div>
      </div>
      <p class="panel-sub">{{ t('home.popularBookSub') }}</p>

      <!-- Ring -->
      <div
        v-show="view === 'ring'"
        ref="ringEl"
        class="mg-ring"
        style="cursor: grab; touch-action: pan-y;"
        @pointerdown="ringDown"
        @pointermove="ringMove"
        @pointerup="ringUp"
        @pointercancel="ringUp"
        @pointerleave="ringLeave"
      >
        <div
          v-for="(w, i) in ringItems"
          :key="w.id"
          :ref="el => setRingEl(i, el as HTMLElement)"
          :data-ring-idx="i"
          role="link"
          :aria-label="w.title"
          class="ring-card"
          :style="{ background: coverBg(w) }"
        >
          <div v-if="i === 0" class="rank-badge gold">1</div>
          <div class="card-foot">
            <div class="foot-text">@{{ w.author }} ・ ♥{{ Number(w.likes).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- Marquee rows -->
      <div v-show="view === 'rows'" class="mg-rankrows">
        <div class="mg-marquee">
          <div class="mg-mtrack mg-mtrack-l">
            <div
              v-for="(w, i) in [...rowTop, ...rowTop]"
              :key="`a${i}`"
              class="marquee-card"
              :style="{ background: coverBg(w) }"
              @click="goWork(w)"
            >
              <div class="rank-badge sm" style="background:#FFD23F">{{ i % rowTop.length + 1 }}</div>
              <div class="card-foot sm"><div class="foot-text">@{{ w.author }} ♥{{ Number(w.likes).toLocaleString() }}</div></div>
            </div>
          </div>
        </div>
        <div class="mg-marquee">
          <div class="mg-mtrack mg-mtrack-r">
            <div
              v-for="(w, i) in [...rowBottom, ...rowBottom]"
              :key="`b${i}`"
              class="marquee-card"
              :style="{ background: coverBg(w) }"
              @click="goWork(w)"
            >
              <div class="rank-badge sm" style="background:#C9B6FF">{{ rowTop.length + (i % rowBottom.length) + 1 }}</div>
              <div class="card-foot sm"><div class="foot-text">@{{ w.author }} ♥{{ Number(w.likes).toLocaleString() }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部居中：查看更多新作（弹跳） -->
    <a href="#feed" class="mg-readmore" :aria-label="t('home.readMore')">
      <span class="mg-bounce readmore-pill">{{ t('home.readMore') }}</span>
      <span class="mg-bounce readmore-arrow">▼</span>
    </a>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import api from '@/api/index';
import { toast } from '@/util/toast';
import defaultAvatar from '@/assets/images/base/avatar.png';

const { t, locale } = useI18n();
const router = useRouter();

// 敏感内容地区由首页(Home.vue)统一请求后通过 props 传入，避免在此重复请求 getCode
const props = defineProps<{ userRegion?: boolean; regionReady?: boolean; allowSensitive?: boolean }>();
// 等待首页地区结果就绪（作品榜请求需要正确的 show_nsfw）；带兜底超时，避免异常时永不加载
function waitRegionReady(): Promise<void> {
  if (props.regionReady) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = watch(() => props.regionReady, (r) => { if (r) { stop(); resolve(); } });
    setTimeout(() => { stop(); resolve(); }, 3000);
  });
}

/* ---------- 数据 ---------- */
interface Creator { id: string; name: string; avatar: string; avatarImg?: string; cover: string; fans: string | number; works: number; isFollowed: boolean; latestCover?: string; latestPostId?: string; latestPostIdNotNsfw?: string }
interface Work { id: string; postId?: string; postIdNotNsfw?: string; title: string; cover: string; author: string; likes: string | number; type: string }

const creators = ref<Creator[]>([]);
const books = ref<Work[]>([]);
const view = ref<'ring' | 'rows'>('ring');

const CRE_COVERS = ['#FF5FA2', '#6C5CE7', '#3B82F6', '#FFD23F', '#22C55E'];

// sprout（前卡弹开时露出的漫画封面）渐变，对齐 moegen SPROUT_COVERS
const SPROUT_COVERS = [
  'linear-gradient(140deg,#FF5FA2,#FF9E45)',
  'linear-gradient(140deg,#6C5CE7,#00CEC9)',
  'linear-gradient(140deg,#3B82F6,#22D3EE)',
  'linear-gradient(140deg,#FFD23F,#FF6B6B)',
  'linear-gradient(140deg,#22C55E,#A3E635)',
];

// 人气漫画假数据（先用 mock，接口就绪后替换）
const MOCK_BOOKS: Work[] = [
  { id: 'm1', title: '星海彼端的信', cover: '', author: 'Aoi', likes: 12800, type: '1' },
  { id: 'm2', title: '午夜咖啡馆', cover: '', author: 'Rin', likes: 9600, type: '2' },
  { id: 'm3', title: '机械之心', cover: '', author: 'Kaze', likes: 8700, type: '1' },
  { id: 'm4', title: '樱色轨迹', cover: '', author: 'Yuki', likes: 7400, type: '3' },
  { id: 'm5', title: '深蓝回声', cover: '', author: 'Sora', likes: 6900, type: '1' },
  { id: 'm6', title: '光与影的协奏', cover: '', author: 'Hana', likes: 5800, type: '2' },
  { id: 'm7', title: '黄昏列车', cover: '', author: 'Ren', likes: 5200, type: '3' },
  { id: 'm8', title: '雪原之约', cover: '', author: 'Mio', likes: 4600, type: '1' },
];

onMounted(async () => {
  try {
    const res = (await api.popularUserRank(1, 6)) as any;
    if ((res.code === 0 || res.code === 200) && res.data?.data) {
      creators.value = res.data.data.map((it: any, i: number) => {
        // 创作者最新作（合集）信息：接口返回在 book 节点下（无 type，默认漫画 1）
        const lb = it.book || {};
        return {
          id: String(it.user_id),
          name: it.user?.nickname ?? '',
          avatar: 'linear-gradient(135deg,#FF7AAE,#FFB443)',
          avatarImg: it.user?.avatar || undefined,
          cover: CRE_COVERS[i % CRE_COVERS.length],
          fans: it.fans_num ?? 0,
          works: Number(it.post_num) || 0,
          isFollowed: it.is_followed === 1 || it.is_followed === '1',
          latestCover: lb.cover || '',
          latestPostId: String(lb.public_post_id ?? ''),
          latestPostIdNotNsfw: String(lb.public_post_id_not_nsfw ?? ''),
        };
      });
    } else {
      toast((locale.value === 'en' ? res.msg : locale.value === 'zh' ? res.msg_cn : locale.value === 'tc' ? res.msg_tc : res.msg_jp) || t('fail'));
    }
  } catch (e) {
    console.error('popularUserRank', e);
    toast(t('fail'));
  }

  // 创作者堆叠动效（左侧面板，与敏感开关无关）
  await nextTick();
  startCreatorStack();

  // 人气作品榜（右侧）：首屏加载
  await loadBooks();
});

// 人气作品榜取数（敏感开关/语言变化时重新请求，与推荐列表逻辑一致）
async function loadBooks() {
  await waitRegionReady();
  try {
    const bookRes = (await api.popularBookRank(1, 10, 'week', 0, locale.value === 'zh' ? 'cn' : locale.value, props.userRegion ? (props.allowSensitive ? 1 : 0) : 0)) as any;
    const list = ((bookRes.code === 0 || bookRes.code === 200) && (bookRes.data?.data || bookRes.data)) || [];
    books.value = (Array.isArray(list) && list.length)
      ? list.map((it: any) => {
        const b = it.book || {};
        return {
          id: String(it.book_id ?? b.id ?? ''),
          postId: String(b.public_post_id ?? ''),
          postIdNotNsfw: String(b.public_post_id_not_nsfw ?? ''),
          title: b.title || '',
          cover: b.cover || '',
          author: it.user?.nickname ?? '',
          likes: Number(it.like_count ?? it.all_like ?? it.like_num ?? 0) || 0,
          type: String(b.type ?? '1'),
        };
      })
      : [];
  } catch (e) {
    console.error('popularBookRank', e);
    books.value = [];
  }
  // 作品为空时用假数据兜底，保证 3D 动效可见
  if (!books.value.length) books.value = MOCK_BOOKS.slice();
  await nextTick();
  startRing();
}

// 敏感内容开关切换（Home 传入）时，重新请求作品榜
watch(() => props.allowSensitive, () => { loadBooks(); });
// 切换语言时重新请求作品榜（与推荐列表逻辑一致）
watch(locale, () => { loadBooks(); });

const onAvatarErr = (e: Event) => { const el = e.target as HTMLImageElement; if (el) el.src = defaultAvatar; };

function goUser(c: Creator) { router.push(`/user-home?id=${c.id}`); }
function goRankUser() { router.push('/rank?tab=user'); }
function goRankWork() { router.push('/rank'); }
function goWork(w: Work) {
  // 根据是否开启敏感内容读取不同的 post id
  const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1';
  const pid = (allowSensitive ? w.postId : w.postIdNotNsfw) || w.postId || w.postIdNotNsfw;
  if (pid) router.push(`/detail?id=${pid}&type=${w.type}`);
  else if (w.id) router.push(`/detail?id=${w.id}&type=${w.type}`);
}

async function toggleFollow(c: Creator) {
  const token = localStorage.getItem('token');
  if (!token) { router.push('/login'); return; }
  const next = !c.isFollowed;
  c.isFollowed = next;
  try {
    const res = (next ? await api.follow({ followed_id: c.id }) : await api.unfollow({ followed_id: c.id })) as any;
    if (res.code !== 0 && res.code !== 200) { c.isFollowed = !next; toast(res.msg || ''); }
  } catch { c.isFollowed = !next; }
}

/* ---------- 拟声词特效 ---------- */
const CRE_FX = [
  { slug: 'chuumoku', style: { top: '116px', left: '2px', '--w': 12, '--rot': '-7deg', '--op': 0.94, '--fdur': '7.4s', '--fdelay': '-1s', '--adelay': '.15s', '--fdx': '8px', '--fdy': '9px', '--frot': '2.4deg' } },
  { slug: 'sasuga', style: { top: '96px', right: '20px', '--w': 15, '--rot': '6deg', '--op': 0.9, '--fdur': '8.6s', '--fdelay': '-3.2s', '--adelay': '.3s', '--fdx': '7px', '--fdy': '8px', '--frot': '2deg' } },
  { slug: 'ouen', style: { bottom: '24px', left: '8px', '--w': 18, '--rot': '-4deg', '--op': 0.9, '--fdur': '9.1s', '--fdelay': '-5.4s', '--adelay': '.45s', '--fdx': '6px', '--fdy': '5px', '--frot': '1.2deg' } },
  { slug: 'korekaramo', style: { bottom: '20px', left: '42%', '--w': 15, '--rot': '3deg', '--op': 0.96, '--fdur': '7.9s', '--fdelay': '-2.1s', '--adelay': '.6s', '--fdx': '5px', '--fdy': '6px', '--frot': '1.6deg' } },
] as any[];
const POP_FX = [
  { slug: 'wadai', style: { top: '188px', left: '0px', '--w': 17, '--rot': '-6deg', '--op': 0.9, '--fdur': '8.3s', '--fdelay': '-1.6s', '--adelay': '.2s', '--fdx': '10px', '--fdy': '10px', '--frot': '2.2deg' } },
  { slug: 'chouninki', style: { top: '150px', right: '4px', '--w': 14, '--rot': '7deg', '--op': 0.93, '--fdur': '7.6s', '--fdelay': '-4.3s', '--adelay': '.35s', '--fdx': '9px', '--fdy': '11px', '--frot': '2.5deg' } },
  { slug: 'minogasuna', style: { bottom: '18px', right: '2px', '--w': 19, '--rot': '-5deg', '--op': 0.9, '--fdur': '9.3s', '--fdelay': '-6.1s', '--adelay': '.5s', '--fdx': '12px', '--fdy': '9px', '--frot': '1.8deg' } },
] as any[];

/* ---------- 左侧创作者 3D 深度堆叠 ---------- */
const creLayer = ref<HTMLDivElement>();
const sproutEl = ref<HTMLDivElement>();
const sproutCoverEl = ref<HTMLDivElement>();
const cardEls: (HTMLElement | null)[] = [];
const setCardEl = (i: number, el: HTMLElement | null) => { cardEls[i] = el; };
const orderRef: number[] = [];
let busy = false;
let creHover: HTMLElement | null = null;
let creTimers: ReturnType<typeof setTimeout>[] = [];
let creInterval: ReturnType<typeof setInterval> | undefined;
let cyclePaused = false;

const creTf = (depth: number) => `translate(-50%,-50%) translateY(${-depth * 34}px) scale(${(1 - depth * 0.09).toFixed(3)})`;

function creLayout() {
  orderRef.forEach((idx, depth) => {
    const el = cardEls[idx];
    if (!el) return;
    el.dataset.depth = String(depth);
    el.style.pointerEvents = depth === 0 ? 'auto' : 'none';
    (el as any).inert = depth !== 0;
    el.style.transition = 'transform .8s cubic-bezier(.22,.61,.36,1), opacity .8s, filter .8s';
    el.style.transform = creTf(depth);
    el.style.opacity = depth > 3 ? '0' : String(1 - depth * 0.16);
    el.style.zIndex = String(100 - depth);
    el.style.filter = depth ? `brightness(${(1 - depth * 0.07).toFixed(2)})` : 'none';
    // 阴影为每张卡片各自的封面强调色（实心硬投影），与 moegen-web-main 首页一致
    el.style.boxShadow = `7px 7px 0 ${creators.value[idx]?.cover ?? '#161122'}`;
  });
}

function startCreatorStack() {
  const cards = cardEls.filter(Boolean) as HTMLElement[];
  if (!cards.length) return;
  orderRef.length = 0;
  cards.forEach((_, i) => orderRef.push(i));
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  creLayout();

  const cycle = () => {
    if (busy || cyclePaused) return;
    busy = true;
    const frontIdx = orderRef[0];
    const el = cardEls[frontIdx];
    const sprout = sproutEl.value;
    if (!el) { busy = false; return; }
    const openX = window.innerWidth <= 1080 ? 62 : 152;
    if (sprout) {
      const cover = sproutCoverEl.value;
      if (cover) {
        const dots = 'radial-gradient(circle at 30% 20%,rgba(255,255,255,.35) 1.3px,transparent 1.5px) 0 0/11px 11px';
        const fallback = SPROUT_COVERS[frontIdx % SPROUT_COVERS.length];
        const latest = creators.value[frontIdx]?.latestCover;
        // 展开露出的卡片显示该创作者最新作（合集）封面，无封面时回退渐变
        cover.style.background = latest
          ? `url(${latest}) center/cover no-repeat,${dots},${fallback}`
          : `${dots},${fallback}`;
      }
      sprout.style.transition = 'transform .6s cubic-bezier(.34,1.4,.5,1), opacity .35s';
      sprout.style.transform = `translate(-50%,-50%) translate(${openX}px,0) rotate(9deg) scale(1)`;
      sprout.style.opacity = '1';
      sprout.style.pointerEvents = 'auto';
      sprout.style.cursor = 'pointer';
      sprout.tabIndex = 0;
    }
    el.style.transition = 'transform .6s cubic-bezier(.34,1.4,.5,1)';
    el.style.transform = `translate(-50%,-50%) translate(${-openX}px,0) rotate(-9deg) scale(1)`;

    const flyOff = () => {
      if (creHover) { creTimers.push(setTimeout(flyOff, 220)); return; }
      if (sprout) { sprout.style.pointerEvents = 'none'; sprout.tabIndex = -1; }
      el.style.transition = 'transform .5s cubic-bezier(.5,0,.75,.2), opacity .45s';
      el.style.transform = 'translate(-50%,-50%) translateX(-860px) rotate(-20deg) scale(1)';
      el.style.opacity = '0';
      if (sprout) {
        sprout.style.transition = 'transform .5s cubic-bezier(.5,0,.75,.2), opacity .45s';
        sprout.style.transform = 'translate(-50%,-50%) translateX(860px) rotate(20deg) scale(1)';
        sprout.style.opacity = '0';
      }
      creTimers.push(setTimeout(() => {
        orderRef.shift();
        orderRef.push(frontIdx);
        const depth = orderRef.length - 1;
        el.style.transition = 'none';
        el.style.transform = creTf(depth);
        el.style.opacity = '0';
        void el.offsetWidth;
        if (sprout) { sprout.style.transition = 'none'; sprout.style.opacity = '0'; sprout.style.transform = 'translate(-50%,-50%) scale(.4)'; }
        creLayout();
        busy = false;
      }, 500));
    };
    creTimers.push(setTimeout(flyOff, 2000));
  };

  if (!reduce) creInterval = setInterval(cycle, 2600);
}

function setHover(el: HTMLElement | null) {
  if (creHover === el) return;
  if (creHover && /scale\(/.test(creHover.style.transform)) {
    creHover.style.transition = 'transform .18s ease';
    creHover.style.transform = creHover.style.transform.replace(/scale\([^)]*\)/, 'scale(1)');
  }
  creHover = el;
  cyclePaused = !!el;
  if (el && /scale\(/.test(el.style.transform)) {
    el.style.transition = 'transform .18s ease';
    el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, 'scale(1.06)');
  }
}

function onCreMove(e: PointerEvent) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  const node = e.target as HTMLElement;
  const sp = sproutEl.value;
  // 弹开的 sprout 悬浮也放大（同前卡）
  if (sp && sp.contains(node) && sp.style.pointerEvents !== 'none') { setHover(sp); return; }
  const c = node.closest?.('[data-card]') as HTMLElement | null;
  setHover(c && c.dataset.depth === '0' ? c : null);
}

function goSprout() {
  const frontIdx = orderRef[0];
  const c = creators.value[frontIdx];
  if (!c) return;
  // 跳转该创作者最新作详情，按敏感内容开关取不同 post id
  const allowSensitive = localStorage.getItem('allowSensitiveContent') == '1';
  const pid = (allowSensitive ? c.latestPostId : c.latestPostIdNotNsfw) || c.latestPostId || c.latestPostIdNotNsfw;
  if (pid) router.push(`/detail?id=${pid}`);
}

/* ---------- 右侧人气作品 3D 环形 ---------- */
const RING_R = 184;
const RING_SPEED = 0.006;
const COVER_DOTS = 'radial-gradient(circle at 30% 20%,rgba(255,255,255,.35) 1.3px,transparent 1.5px) 0 0/11px 11px';
const coverBg = (w: Work) => (w.cover ? `url(${w.cover}) center/cover no-repeat,${COVER_DOTS},linear-gradient(140deg,#FF5FA2,#FF9E45)` : `${COVER_DOTS},linear-gradient(140deg,#FF5FA2,#FF9E45)`);

const ringEl = ref<HTMLDivElement>();
const ringCardEls: (HTMLElement | null)[] = [];
const setRingEl = (i: number, el: HTMLElement | null) => { ringCardEls[i] = el; };
const ringItems = ref<Work[]>([]);
const rowTop = ref<Work[]>([]);
const rowBottom = ref<Work[]>([]);

let ringRaf = 0;
let ringAngle = 0;
let ringDragging = false;
let ringMoved = false;
let hoverIdx: number | null = null;
let boost: number[] = [];
const ringDrag = { on: false, startX: 0, startAngle: 0 };
let pressedIdx: number | null = null;

function startRing() {
  if (ringRaf) cancelAnimationFrame(ringRaf);
  ringItems.value = books.value.slice(0, 8);
  const half = Math.ceil(books.value.length / 2);
  rowTop.value = books.value.slice(0, half);
  rowBottom.value = books.value.slice(half);

  const n = ringItems.value.length;
  if (!n) return;
  boost = ringItems.value.map(() => 1);
  hoverIdx = null;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const HOVER_SCALE = reduce ? 1.06 : 1.15;
  const STEP = (Math.PI * 2) / n;
  const TWO_PI = Math.PI * 2;
  let last = performance.now();

  const loop = (now: number) => {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    const hi = ringDragging ? null : hoverIdx;
    if (ringDragging) { /* angle set by move */ }
    else if (hi != null) {
      let diff = (-hi * STEP - ringAngle) % TWO_PI;
      if (diff > Math.PI) diff -= TWO_PI; else if (diff < -Math.PI) diff += TWO_PI;
      ringAngle += reduce ? diff : diff * (1 - Math.pow(1 - 0.16, dt));
    } else { ringAngle += RING_SPEED * dt; }
    const kBoost = reduce ? 1 : 1 - Math.pow(1 - 0.22, dt);
    for (let i = 0; i < n; i++) {
      const el = ringCardEls[i];
      if (!el) continue;
      const b0 = boost[i] ?? 1;
      const b = b0 + ((hi === i ? HOVER_SCALE : 1) - b0) * kBoost;
      boost[i] = b;
      const th = ringAngle + i * STEP;
      const x = Math.sin(th) * RING_R;
      const depth = Math.cos(th);
      const tt = (depth + 1) / 2;
      const sc = (0.1935 + Math.pow(tt, 1.6) * 0.3065) * b;
      const y = -depth * 20;
      el.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      el.style.zIndex = hi === i ? '120' : String(Math.round(tt * 100));
      el.style.opacity = (0.4 + tt * 0.6).toFixed(3);
      el.style.filter = `brightness(${(0.68 + tt * 0.32).toFixed(2)})`;
    }
    ringRaf = requestAnimationFrame(loop);
  };
  ringRaf = requestAnimationFrame(loop);
}

function ringDown(e: PointerEvent) {
  e.preventDefault();
  ringDrag.on = true; ringDrag.startX = e.clientX; ringDrag.startAngle = ringAngle;
  ringMoved = false; ringDragging = true; hoverIdx = null;
  const card = (e.target as HTMLElement).closest?.('[data-ring-idx]') as HTMLElement | null;
  pressedIdx = card ? Number(card.dataset.ringIdx) : null;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
}
function ringMove(e: PointerEvent) {
  if (ringDrag.on) {
    if (Math.abs(e.clientX - ringDrag.startX) > 6) ringMoved = true;
    ringAngle = ringDrag.startAngle + (e.clientX - ringDrag.startX) * 0.012;
    return;
  }
  if (e.pointerType === 'mouse') {
    const card = (e.target as HTMLElement).closest?.('[data-ring-idx]') as HTMLElement | null;
    hoverIdx = card ? Number(card.dataset.ringIdx) : null;
  }
}
function ringLeave() { hoverIdx = null; }
function ringUp() {
  const wasClick = ringDrag.on && !ringMoved;
  const idx = pressedIdx;
  ringDrag.on = false; ringDragging = false; pressedIdx = null;
  if (wasClick && idx != null) { const w = ringItems.value[idx]; if (w) goWork(w); }
}

onBeforeUnmount(() => {
  if (creInterval) clearInterval(creInterval);
  creTimers.forEach(clearTimeout);
  creTimers = [];
  cancelAnimationFrame(ringRaf);
});
</script>

<style scoped lang="scss">
$ink: #161122;
$pink: #FF4D8D;

.mg-split {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 8px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
}

.cre-panel, .pop-panel {
  position: relative;
  overflow: hidden;
  border: 3px solid $ink;
  border-radius: 6px;
  padding: 34px 44px 40px;
  isolation: isolate;
}
.cre-panel { background: #EAF2FF; }
.pop-panel { background: #FFEFF5; }

.panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  margin-bottom: 6px;

  .panel-title { font-size: 26px; font-weight: 900; color: $ink; margin: 0; white-space: nowrap; }
  .flex-1 { flex: 1; }
  .head-more {
    background: none; border: none; padding: 0; cursor: pointer;
    font-size: 13px; font-weight: 800; color: $pink; white-space: nowrap;
  }
  .view-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; border: 2px solid $ink; border-radius: 999px;
    font-size: 12px; font-weight: 800; color: $ink; cursor: pointer;
    padding: 5px 12px; box-shadow: 2px 2px 0 $ink;
  }
}
.panel-sub { margin: 0 0 6px; font-size: 13px; font-weight: 600; opacity: 0.5; }

.sec-fx { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.mg-seceffect {
  position: absolute;
  width: min(calc(var(--w, 12) * 1%), calc(var(--w, 12) * 0.88 * 1vh));
  z-index: 0; pointer-events: none;
  opacity: var(--op, 0.9);
  transform: rotate(var(--rot, 0deg));
  filter: drop-shadow(0 5px 12px rgba(22, 17, 34, 0.16));
  animation: mgSecAppear 1s cubic-bezier(.16,1,.3,1) var(--adelay, 0s) both,
             mgFloat var(--fdur, 8s) ease-in-out var(--fdelay, 0s) infinite;
}
@keyframes mgSecAppear { from { opacity: 0; } to { opacity: var(--op, 0.9); } }
@keyframes mgFloat {
  0%   { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
  22%  { transform: translate(var(--fdx, 10px), calc(var(--fdy, 12px) * -1)) rotate(calc(var(--rot, 0deg) + var(--frot, 2deg))); }
  50%  { transform: translate(calc(var(--fdx, 10px) * .15), calc(var(--fdy, 12px) * -.35)) rotate(var(--rot, 0deg)); }
  78%  { transform: translate(calc(var(--fdx, 10px) * -1), var(--fdy, 12px)) rotate(calc(var(--rot, 0deg) - var(--frot, 2deg))); }
  100% { transform: translate(0, 0) rotate(var(--rot, 0deg)); }
}

/* 创作者层 */
.mg-crelayer { position: relative; height: 420px; z-index: 1; }
.cre-card {
  position: absolute; left: 50%; top: 52%;
  display: flex; flex-direction: column; justify-content: center; text-align: center;
  background: #fff; border: 3px solid $ink;
  width: 248px; transform: translate(-50%, -50%);
  border-radius: 22px; padding: 28px 24px; min-height: 363px;
  cursor: pointer; will-change: transform, opacity;

  .cre-avatar {
    width: 88px; height: 88px; margin: 0 auto 12px;
    border-radius: 999px; border: 3px solid $ink; overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; }
  }
  .cre-name { font-size: 19px; font-weight: 800; color: $ink; }
  .cre-meta { font-size: 12px; font-weight: 600; opacity: 0.55; margin: 3px 0 14px; }
  .cre-follow {
    width: 100%; padding: 10px; border: none; border-radius: 12px;
    background: $ink; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer;
    &.following { background: #FFD23F; color: $ink; border: 2px solid $ink; padding: 8px; }
  }
}

/* sprout 漫画封面（门开效果） */
.cre-sprout {
  position: absolute; left: 50%; top: 52%;
  width: 248px; height: 331px;
  transform: translate(-50%, -50%) scale(.4);
  transform-origin: 50% 50%;
  border: 3px solid $ink; border-radius: 22px; overflow: hidden;
  opacity: 0; box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
  will-change: transform, opacity; pointer-events: none; z-index: 99;
  padding: 0; cursor: pointer;

  .sprout-cover { position: absolute; inset: 0; }
  .sprout-badge {
    position: absolute; left: 8px; top: 8px;
    background: #FFD23F; color: $ink; font-size: 10px; font-weight: 800;
    padding: 2px 8px; border-radius: 999px; border: 2px solid $ink;
  }
}

/* 环形 */
.mg-ring { position: relative; height: 420px; user-select: none; z-index: 1; }
.ring-card {
  position: absolute; left: 50%; top: 52%;
  width: 600px; aspect-ratio: 3 / 4;
  transform: translate(-50%, -50%);
  border: 8px solid $ink; border-radius: 48px; overflow: hidden;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.22);
  cursor: pointer; will-change: transform;
}
/* 卡片按 2× 超采样渲染（再缩小到相同显示尺寸）以提升清晰度；卡内元素同比 ×2，仅作用于 3D 环形卡（不影响跑马灯） */
.ring-card .rank-badge { font-size: 32px; padding: 10px 28px; border-width: 6px; }
.ring-card .card-foot { padding: 90px 36px 36px; }
.ring-card .card-foot .foot-text { font-size: 32px; }
.rank-badge {
  position: absolute; left: 9px; top: 9px;
  border: 2px solid $ink; border-radius: 999px;
  font-size: 11px; font-weight: 800; color: $ink;
  padding: 3px 9px; z-index: 2;
  &.gold { background: #FFD23F; }
  &.sm { left: 6px; top: 6px; padding: 2px 8px; }
}
.card-foot {
  position: absolute; inset-inline: 0; bottom: 0;
  padding: 30px 12px 12px; color: #fff;
  background: linear-gradient(transparent, rgba(11, 11, 18, 0.85));
  &.sm { padding: 16px 8px 7px; }
  .foot-text { font-size: 11px; font-weight: 600; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

/* 跑马灯 */
.mg-rankrows { height: 420px; display: flex; flex-direction: column; justify-content: center; gap: 18px; z-index: 1; position: relative; }
.mg-marquee {
  overflow: hidden; cursor: grab; touch-action: pan-y;
  padding: 22px 0; margin: -22px 0;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
}
.mg-mtrack { display: flex; width: max-content; will-change: transform; }
.mg-mtrack-l { animation: mgMarqL 42s linear infinite; }
.mg-mtrack-r { animation: mgMarqR 42s linear infinite; }
.mg-marquee:hover .mg-mtrack { animation-play-state: paused; }
@keyframes mgMarqL { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes mgMarqR { from { transform: translateX(-50%); } to { transform: translateX(0); } }
.marquee-card {
  position: relative; flex: none; width: 132px; aspect-ratio: 3 / 4;
  margin-right: 14px; border: 2.5px solid $ink; border-radius: 12px; overflow: hidden;
  box-shadow: 3px 3px 0 rgba(22, 17, 34, 0.16); cursor: pointer;
}

/* 底部查看更多新作（弹跳） */
.mg-readmore {
  position: absolute; left: 50%; bottom: 22px;
  transform: translateX(-50%);
  z-index: 16;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  text-decoration: none;

  .readmore-pill {
    position: relative;
    background: #FFD23F; color: $ink;
    font-size: 19px; font-weight: 900; letter-spacing: .5px;
    white-space: nowrap;
    border: 3px solid $ink; border-radius: 6px;
    padding: 13px 30px;
    box-shadow: 5px 5px 0 $ink;
  }
  .readmore-arrow {
    font: 900 26px sans-serif;
    color: #FFD23F;
    -webkit-text-stroke: 2px $ink;
    margin-top: 1px;
  }
}
.mg-bounce { animation: mgBounce 1.4s ease-in-out infinite; }
@keyframes mgBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(7px); } }

@media (max-width: 1080px) {
  .mg-crelayer, .mg-ring { height: 360px; transform: scale(.82); transform-origin: center 46%; }
  .mg-mtrack-l, .mg-mtrack-r { animation-duration: 30s; }
  .mg-seceffect { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .mg-mtrack-l, .mg-mtrack-r, .mg-seceffect, .mg-bounce { animation: none; }
}
</style>
