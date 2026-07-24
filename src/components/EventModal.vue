<template>
  <div
    v-if="visible"
    class="mg-evovl"
    :class="{ 'mg-ev-closing': closing }"
    role="dialog"
    aria-modal="true"
    @click="dismiss"
  >
    <div class="mg-evburst" aria-hidden="true"></div>

    <div
      ref="panel"
      class="mg-evpanel"
      :class="{ 'mg-ev-closing': closing }"
      @click.stop
    >
      <div class="ev-decal" aria-hidden="true"></div>

      <!-- tab -->
      <div class="ev-tab">{{ t('home.eventModal.heading') }}</div>

      <!-- close -->
      <span class="mg-ev-close" role="button" tabindex="0" @click="dismiss" @keydown.enter.space.prevent="dismiss">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="3" stroke-linecap="round">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </span>

      <div class="mg-ev-scroll">
        <div class="ev-band">
          <div class="mg-ev-shimmer" aria-hidden="true"></div>
          <span class="ev-badge">{{ t('home.eventModal.badge') }}</span>
        </div>

        <div class="ev-title">{{ t('home.eventModal.title') }}</div>
        <p class="ev-body">{{ t('home.eventModal.body') }}</p>

        <div class="ev-actions">
          <button class="mg-ev-btn ev-primary" @click="openDetail">{{ t('home.eventModal.detail') }} →</button>
          <button class="mg-ev-btn ev-ghost" @click="dismiss">{{ t('home.eventModal.later') }}</button>
        </div>

        <div class="ev-check" role="checkbox" :aria-checked="dontShow" tabindex="0" @click="dontShow = !dontShow" @keydown.enter.space.prevent="dontShow = !dontShow">
          <span class="mg-ev-cb" :data-checked="dontShow ? '1' : '0'" :style="{ background: dontShow ? '#FF4D8D' : '#fff' }">{{ dontShow ? '✓' : '' }}</span>
          <span class="ev-check-label">{{ t('home.eventModal.dontShow') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const STORAGE_KEY = 'moegen_event_hide';
const OPEN_DELAY_MS = 900;
const CLOSE_ANIM_MS = 190;

const visible = ref(false);
const closing = ref(false);
const dontShow = ref(false);
const panel = ref<HTMLDivElement>();
let openTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  let hidden = false;
  try { hidden = localStorage.getItem(STORAGE_KEY) === '1'; } catch {}
  if (hidden) return;
  openTimer = setTimeout(() => { visible.value = true; }, OPEN_DELAY_MS);
  window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer);
  window.removeEventListener('keydown', onKey);
});

function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && visible.value) dismiss(); }

function dismiss() {
  if (dontShow.value) { try { localStorage.setItem(STORAGE_KEY, '1'); } catch {} }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { visible.value = false; return; }
  closing.value = true;
  setTimeout(() => { visible.value = false; closing.value = false; }, CLOSE_ANIM_MS);
}

function openDetail() {
  // TODO: 活动详情页路由就绪后跳转，暂先关闭弹窗
  dismiss();
}
</script>

<style scoped lang="scss">
$ink: #161122;
$pink: #FF4D8D;

.mg-evovl {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(22, 17, 34, 0.58);
  display: flex; align-items: center; justify-content: center;
  padding: 28px; overflow: hidden;
  animation: mgEvOverlayIn .22s ease-out both;
  &.mg-ev-closing { animation: mgEvOverlayOut 190ms ease-in both; }
}

.mg-evburst {
  position: absolute; left: 50%; top: 50%;
  width: min(160vmax, 1600px); height: min(160vmax, 1600px);
  transform: translate(-50%, -50%); pointer-events: none;
  background: repeating-conic-gradient(rgba(255,255,255,.15) 0 1.1deg, transparent 1.1deg 5.6deg);
  -webkit-mask-image: radial-gradient(circle, transparent 0 24%, #000 46%, transparent 74%);
  mask-image: radial-gradient(circle, transparent 0 24%, #000 46%, transparent 74%);
  animation: mgEvBurst .5s ease-out both;
}

.mg-evpanel {
  position: relative;
  width: min(540px, 92vw);
  max-height: calc(100vh - 80px);
  background: #fff;
  border: 4px solid $ink;
  border-radius: 8px;
  box-shadow: 12px 12px 0 rgba(22, 17, 34, 0.85);
  padding: 20px 20px 22px;
  animation: mgEvPanelIn .52s cubic-bezier(.2,1.1,.32,1) both;
  transform: rotate(-1.2deg);
  &.mg-ev-closing { animation: mgEvPanelOut 190ms cubic-bezier(.5,0,.75,0) both; }
}

.ev-decal {
  position: absolute; right: 0; top: 0; width: 150px; height: 150px;
  pointer-events: none; border-radius: 0 4px 0 0;
  background-image: radial-gradient(#161122 1.2px, transparent 1.2px);
  background-size: 9px 9px; opacity: .1;
  -webkit-mask-image: radial-gradient(circle at 100% 0%, #000 0 45%, transparent 72%);
  mask-image: radial-gradient(circle at 100% 0%, #000 0 45%, transparent 72%);
}

.ev-tab {
  position: absolute; top: -20px; left: -14px;
  transform: rotate(-3.5deg);
  background: #FFD23F; border: 3px solid $ink; border-radius: 6px;
  box-shadow: 4px 4px 0 $ink; padding: 8px 20px;
  font-size: 21px; font-weight: 800; color: $ink; letter-spacing: .03em; white-space: nowrap;
}

.mg-ev-close {
  position: absolute; top: -16px; right: -16px;
  width: 40px; height: 40px; border-radius: 999px;
  background: #fff; border: 3px solid $ink; box-shadow: 3px 3px 0 $ink;
  display: grid; place-items: center; cursor: pointer; z-index: 2;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
  &:hover { transform: rotate(90deg) scale(1.08); box-shadow: 3px 3px 0 $ink; }
  &:active { transform: rotate(90deg) scale(.92); box-shadow: 1px 1px 0 $ink; }
}

.mg-ev-scroll { max-height: calc(100vh - 130px); overflow-y: auto; overflow-x: hidden; margin: 0 -4px; padding: 0 4px; }

.ev-band {
  margin-top: 20px; border: 3px solid $ink; border-radius: 6px;
  overflow: hidden; position: relative; height: clamp(150px, 26vh, 230px);
  background-image: radial-gradient(rgba(255,255,255,.5) 1.5px, transparent 1.5px), linear-gradient(120deg,#FF4D8D 0%,#FF9E45 55%,#FFD23F 100%);
  background-size: 15px 15px, 100% 100%;
}
.mg-ev-shimmer {
  position: absolute; top: 0; left: 0; width: 55%; height: 100%;
  background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.55) 50%, transparent 80%);
  animation: mgEvShimmer 5.2s ease-in-out infinite; animation-delay: 1.1s; pointer-events: none;
}
.ev-badge {
  position: absolute; left: 10px; top: 10px; padding: 5px 12px; border-radius: 999px;
  background: $pink; border: 2px solid $ink; color: #fff; font-weight: 800; font-size: 12px; box-shadow: 2px 2px 0 $ink;
}

.ev-title { margin-top: 14px; font-size: 19px; font-weight: 800; color: $ink; letter-spacing: .02em; line-height: 1.4; }
.ev-body { margin: 8px 0 0; font-weight: 700; font-size: 13.5px; line-height: 1.75; color: $ink; opacity: .82; }

.ev-actions { display: flex; gap: 10px; margin-top: 16px; }
.mg-ev-btn {
  padding: 13px 10px; border-radius: 999px; border: 3px solid $ink;
  font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 3px 3px 0 $ink;
  transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
  &:hover { transform: translate(-1px,-2px); box-shadow: 4px 5px 0 $ink; }
  &:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 $ink; }
}
.ev-primary { flex: 1; background: $pink; color: #fff; }
.ev-ghost { flex: none; padding: 13px 20px; background: #fff; color: $ink; }

.ev-check { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 13px; cursor: pointer; user-select: none; }
.mg-ev-cb {
  width: 18px; height: 18px; border: 2px solid $ink; border-radius: 5px;
  display: grid; place-items: center; color: #fff; font-weight: 900; font-size: 12px; flex: none;
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), background .15s ease-out;
  &[data-checked="1"] { transform: scale(1.12); }
}
.ev-check-label { font-weight: 700; font-size: 12.5px; color: $ink; opacity: .66; }

@keyframes mgEvOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mgEvOverlayOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes mgEvPanelIn {
  0% { transform: scale(.45) rotate(-10deg); opacity: 0; }
  55% { transform: scale(1.07) rotate(.8deg); opacity: 1; }
  78% { transform: scale(.97) rotate(-1.8deg); }
  100% { transform: scale(1) rotate(-1.2deg); opacity: 1; }
}
@keyframes mgEvPanelOut {
  from { transform: scale(1) rotate(-1.2deg); opacity: 1; }
  to { transform: scale(.94) rotate(-2.6deg); opacity: 0; }
}
@keyframes mgEvBurst { 0% { opacity: 0; } 35% { opacity: .95; } 100% { opacity: .55; } }
@keyframes mgEvShimmer {
  0%, 68% { transform: translateX(-120%) skewX(-14deg); opacity: 0; }
  78% { opacity: .8; }
  92%, 100% { transform: translateX(220%) skewX(-14deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .mg-evburst, .mg-ev-shimmer { display: none; }
  .mg-evpanel { animation: none !important; transform: rotate(-1.2deg); }
}
</style>
