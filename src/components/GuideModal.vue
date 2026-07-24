<template>
  <div v-if="visible" class="mg-hm-ovl" @click="handleSkip" role="dialog" aria-modal="true">
    <div class="mg-hm-panel" @click.stop>
      <div class="hm-decal" aria-hidden="true"></div>

      <div class="guide-tag">
        <span class="tag-star">✦</span>
        {{ t('home.guide.title') }}
      </div>

      <h3 class="guide-title">{{ t(cur.titleKey) }}</h3>
      <p class="guide-body">{{ t(cur.bodyKey) }}</p>

      <!-- step dots -->
      <div class="guide-dots">
        <span
          v-for="(s, i) in STEPS"
          :key="i"
          class="dot"
          :class="{ active: i === step }"
        ></span>
      </div>

      <div class="guide-actions">
        <button v-if="!isLast" class="mg-hm-btn ghost" @click="handleSkip">{{ t('home.guide.skip') }}</button>
        <button class="mg-hm-btn primary" @click="next">{{ isLast ? t('home.guide.start') : t('home.guide.next') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['close']);
const { t } = useI18n();

const STEPS = [
  { titleKey: 'home.guide.step1Title', bodyKey: 'home.guide.step1Body' },
  { titleKey: 'home.guide.step2Title', bodyKey: 'home.guide.step2Body' },
  { titleKey: 'home.guide.step3Title', bodyKey: 'home.guide.step3Body' },
  { titleKey: 'home.guide.step4Title', bodyKey: 'home.guide.step4Body' },
];

const step = ref(0);
const isLast = computed(() => step.value === STEPS.length - 1);
const cur = computed(() => STEPS[step.value]);

// 每次打开重置到第一步 + 锁滚动
watch(() => props.visible, (v) => {
  if (v) {
    step.value = 0;
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

function next() {
  if (isLast.value) { step.value = 0; emit('close'); }
  else step.value += 1;
}
function handleSkip() { step.value = 0; emit('close'); }
</script>

<style scoped lang="scss">
$ink: #161122;
$pink: #FF4D8D;
$paper: #FFFDF7;

.mg-hm-ovl {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(22, 17, 34, 0.5);
  animation: mgHmFade .18s ease-out both;
}

.mg-hm-panel {
  position: relative;
  width: min(400px, 92%);
  padding: 22px 24px;
  background: $paper;
  border: 3px solid $ink;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.18);
  animation: mgHmPop .26s cubic-bezier(.16,1,.3,1) both;
}

.hm-decal {
  position: absolute; right: 0; top: 0; width: 120px; height: 120px;
  pointer-events: none; border-radius: 0 14px 0 0;
  background-image: radial-gradient(#161122 1px, transparent 1px);
  background-size: 8px 8px; opacity: .07;
  -webkit-mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
  mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
}

.guide-tag {
  display: inline-flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
  padding: 4px 12px; border-radius: 999px;
  background: $pink; color: #fff; border: 2px solid $ink;
  font-weight: 800; font-size: 11px; letter-spacing: .06em;
  .tag-star { font-size: 13px; }
}

.guide-title { margin: 0; font-size: 20px; font-weight: 900; color: $ink; }
.guide-body { margin: 10px 0 0; font-size: 13.5px; font-weight: 600; line-height: 1.8; color: $ink; opacity: .7; }

.guide-dots {
  display: flex; align-items: center; gap: 6px; margin-top: 16px;
  .dot {
    width: 8px; height: 8px; border-radius: 999px;
    background: #d8d2e0; border: 1.5px solid $ink;
    transition: all .2s;
    &.active { width: 20px; background: $pink; }
  }
}

.guide-actions { display: flex; gap: 10px; margin-top: 20px; }
.mg-hm-btn {
  flex: 1; padding: 11px 10px; border-radius: 12px; border: 2px solid $ink;
  font-weight: 800; font-size: 14px; cursor: pointer;
  box-shadow: 2px 2px 0 $ink;
  transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
  &:hover { transform: translate(-1px,-2px); box-shadow: 4px 5px 0 rgba(22,17,34,.4); }
  &:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 rgba(22,17,34,.4); }
}
.mg-hm-btn.ghost { background: #fff; color: $ink; }
.mg-hm-btn.primary { background: $pink; color: #fff; }

@keyframes mgHmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mgHmPop { 0% { opacity: 0; transform: scale(.94) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .mg-hm-ovl, .mg-hm-panel { animation: mgHmFade .16s ease-out both; }
  .mg-hm-btn { transition: none; }
  .mg-hm-btn:hover, .mg-hm-btn:active { transform: none; }
}
</style>
