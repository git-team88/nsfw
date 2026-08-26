<template>
  <Teleport to="body">
    <div v-if="visible" class="guide-root" role="dialog" aria-modal="true">
    <!-- 拦截交互层 -->
    <div class="guide-block"></div>

    <!-- 有目标：聚光灯高亮（box-shadow 镂空遮罩）；无目标：全屏暗色 -->
    <div v-if="hasTarget" class="guide-spot" :style="spotStyle"></div>
    <div v-else class="guide-dim"></div>

    <!-- 底部居中卡片 -->
    <div class="guide-bubble">
      <div class="guide-halftone" aria-hidden="true"></div>
      <svg class="guide-mascot" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="25" r="18.5" fill="#1a1a1a" stroke="#f5f5f5" stroke-width="2.6" />
        <path d="M9 19 Q24 5 39 19" stroke="#f5f5f5" stroke-width="2.6" fill="none" stroke-linecap="round" />
        <circle cx="18" cy="24" r="2.4" fill="#f5f5f5" />
        <circle cx="30" cy="24" r="2.4" fill="#f5f5f5" />
        <path d="M19 31 Q24 35.5 29 31" stroke="#f5f5f5" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <circle cx="13.5" cy="29" r="2" fill="#FF7AAE" />
        <circle cx="34.5" cy="29" r="2" fill="#FF7AAE" />
      </svg>

      <div class="guide-content">
        <div class="guide-tag">{{ t('home.guide.label') }} · {{ step + 1 }}/{{ STEPS.length }}</div>
        <h3 class="guide-title">{{ t(cur.titleKey) }}</h3>
        <p class="guide-body">{{ t(cur.bodyKey) }}</p>

        <div class="guide-actions">
          <span class="guide-skip" @click="handleSkip">{{ t('home.guide.skip') }}</span>
          <span class="flex-1"></span>
          <button v-if="step > 0" class="guide-btn line" @click="prev">{{ t('home.guide.back') }}</button>
          <button class="guide-btn fill" @click="next">{{ isLast ? t('home.guide.start') : t('home.guide.next') }}</button>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['close']);
const { t } = useI18n();

// 每步锚定的页面元素（与 moegen-new-hp 引导对应）
const STEPS = [
  { titleKey: 'home.guide.step1Title', bodyKey: 'home.guide.step1Body', sel: null as string | null },
  { titleKey: 'home.guide.step2Title', bodyKey: 'home.guide.step2Body', sel: '.hero-section' },
  { titleKey: 'home.guide.step3Title', bodyKey: 'home.guide.step3Body', sel: '.mg-crelayer' },
  { titleKey: 'home.guide.step4Title', bodyKey: 'home.guide.step4Body', sel: '.mg-ring' },
  { titleKey: 'home.guide.step5Title', bodyKey: 'home.guide.step5Body', sel: '.feed-heading' },
  { titleKey: 'home.guide.step6Title', bodyKey: 'home.guide.step6Body', sel: null },
];

const step = ref(0);
const isLast = computed(() => step.value === STEPS.length - 1);
const cur = computed(() => STEPS[step.value]);
const hasTarget = computed(() => !!cur.value.sel);
const spotStyle = ref<Record<string, string>>({ opacity: '0' });

let rafId = 0;

function computeSpot() {
  const sel = cur.value.sel;
  if (!sel) return;
  const el = document.querySelector(sel) as HTMLElement | null;
  if (!el) { spotStyle.value = { opacity: '0' }; return; }
  const r = el.getBoundingClientRect();
  const pad = 10;
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // 高亮框限制在视口范围内，避免超大或超出屏幕的元素在小屏上定位异常
  const left = Math.max(margin, r.left - pad);
  const top = Math.max(margin, r.top - pad);
  const right = Math.min(vw - margin, r.right + pad);
  const bottom = Math.min(vh - margin, r.bottom + pad);
  spotStyle.value = {
    opacity: '1',
    left: left + 'px',
    top: top + 'px',
    width: Math.max(0, right - left) + 'px',
    height: Math.max(0, bottom - top) + 'px',
  };
}

function reposition() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(computeSpot);
}

// 切到某一步：滚动到目标并定位聚光灯
function goStep(scroll = true) {
  const sel = cur.value.sel;
  if (!sel) return;
  const el = document.querySelector(sel) as HTMLElement | null;
  if (el && scroll) {
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* noop */ }
  }
  setTimeout(computeSpot, scroll ? 420 : 0);
  // 二次校正：等平滑滚动/懒加载布局稳定后再定位一次
  if (scroll) setTimeout(computeSpot, 760);
}

function next() {
  if (isLast.value) { close(); }
  else { step.value += 1; nextTick(() => goStep()); }
}
function prev() {
  if (step.value > 0) { step.value -= 1; nextTick(() => goStep()); }
}
function handleSkip() { close(); }
function close() { step.value = 0; emit('close'); }

function onScrollResize() { reposition(); }

watch(() => props.visible, (v) => {
  if (v) {
    step.value = 0;
    window.addEventListener('scroll', onScrollResize, true);
    window.addEventListener('resize', onScrollResize);
    nextTick(() => setTimeout(() => goStep(), 60));
  } else {
    window.removeEventListener('scroll', onScrollResize, true);
    window.removeEventListener('resize', onScrollResize);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollResize, true);
  window.removeEventListener('resize', onScrollResize);
});
</script>

<style scoped lang="scss">

.guide-root { position: fixed; inset: 0; z-index: 1000; }

/* 拦截页面交互 */
.guide-block { position: fixed; inset: 0; z-index: 1000; }

/* 聚光灯高亮：内部透明，外部用超大 box-shadow 做暗色遮罩 */
.guide-spot {
  position: fixed;
  z-index: 1001;
  border: 3px solid #fff;
  border-radius: 18px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  opacity: 0;
  transition:
    left .45s cubic-bezier(.16, 1, .3, 1),
    top .45s cubic-bezier(.16, 1, .3, 1),
    width .45s cubic-bezier(.16, 1, .3, 1),
    height .45s cubic-bezier(.16, 1, .3, 1),
    opacity .3s;
}

/* 无目标步骤的全屏暗色 */
.guide-dim {
  position: fixed; inset: 0; z-index: 1001;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  animation: guideFade .3s ease-out both;
}

/* 底部居中卡片 */
.guide-bubble {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  z-index: 1002;
  width: min(560px, 92vw);
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  padding: 20px 26px 18px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  overflow: hidden;
  animation: guidePop .5s cubic-bezier(.2, 1.1, .32, 1) both;
}

.guide-halftone {
  position: absolute; right: -10px; bottom: -10px;
  width: 130px; height: 100px; pointer-events: none;
  background: radial-gradient(rgba(255,255,255,0.03) 1.4px, transparent 1.4px);
  background-size: 10px 10px; opacity: .08;
  -webkit-mask-image: radial-gradient(circle at 100% 100%, #000 0 46%, transparent 74%);
  mask-image: radial-gradient(circle at 100% 100%, #000 0 46%, transparent 74%);
}

.guide-mascot { width: 62px; height: 62px; flex: none; }

.guide-content { flex: 1; min-width: 0; position: relative; }

.guide-tag { font-weight: 800; font-size: 11px; letter-spacing: .12em; color: #ff4f9a; }
.guide-title { margin: 5px 0 6px; font-size: 21px; font-weight: 900; color: #f5f5f5; }
.guide-body { margin: 0; font-size: 14px; line-height: 1.85; color: #f5f5f5; opacity: .85; }

.guide-actions { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.flex-1 { flex: 1; }
.guide-skip {
  font-weight: 700; font-size: 13px; color: #f5f5f5; opacity: .5;
  cursor: pointer; user-select: none; transition: opacity .15s;
  &:hover { opacity: 1; }
}
.guide-btn {
  padding: 9px 16px; border-radius: 14px; border: 1px solid #3d3d3d;
  font-weight: 800; font-size: 13px; cursor: pointer;
  box-shadow: none;
  transition: transform .15s cubic-bezier(.34, 1.56, .64, 1), box-shadow .15s ease-out;
  &:hover { transform: translate(-1px, -2px); box-shadow: none; }
  &:active { transform: translate(1px, 1px); box-shadow: none; }
  &.line { background: #1a1a1a; color: #f5f5f5; }
  &.fill { background: linear-gradient(135deg, #ff4f9a, #ff2d7f); color: #f5f5f5; }
}

@keyframes guideFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes guidePop {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .guide-spot { transition: opacity .2s; }
  .guide-bubble { animation: guideFade .2s ease-out both; }
  .guide-btn { transition: none; &:hover, &:active { transform: none; } }
}

@media (max-width: 768px) {
  .guide-bubble { padding: 16px 18px 14px; gap: 12px; bottom: 20px; }
  .guide-mascot { width: 48px; height: 48px; }
  .guide-title { font-size: 18px; }
  .guide-body { font-size: 13px; }
}
</style>
