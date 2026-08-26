<template>
  <div class="mg-hm-ovl" role="dialog" aria-modal="true">
    <div class="mg-hm-panel">
      <div class="hm-decal" aria-hidden="true"></div>

      <button class="hm-close" @click="handleClose" :aria-label="t('home.underage.ok')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="hm-badge">
        <span class="badge-icon">🔞</span>
        {{ t('home.mode.unlimited') }}
      </div>

      <p class="hm-body">{{ t('home.underage.description') }}</p>

      <div class="hm-actions">
        <button class="mg-hm-btn primary" @click="handleClose">{{ t('home.underage.ok') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

const handleClose = () => emit('close');
</script>

<style scoped lang="scss">
.mg-hm-ovl {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(0, 0, 0, 0.5);
  animation: mgHmFade .18s ease-out both;
}

.mg-hm-panel {
  position: relative;
  width: min(400px, 92%);
  padding: 22px 24px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
  animation: mgHmPop .26s cubic-bezier(.16,1,.3,1) both;
}

.hm-decal {
  position: absolute; right: 0; top: 0; width: 120px; height: 120px;
  pointer-events: none; border-radius: 0 14px 0 0;
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 8px 8px; opacity: .07;
  -webkit-mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
  mask-image: radial-gradient(circle at 100% 0%, #000 0 40%, transparent 68%);
}

.hm-close {
  position: absolute; right: 14px; top: 14px;
  width: 32px; height: 32px; border-radius: 999px;
  background: #1a1a1a; border: 1px solid #3d3d3d; box-shadow: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.hm-badge {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: 12px;
  padding: 3px 12px; border-radius: 999px;
  background: #FFD23F; color: #1a1a1a; border: 1px solid #3d3d3d;
  font-weight: 800; font-size: 11px; letter-spacing: .06em;
  .badge-icon { font-size: 13px; }
}

.hm-body { margin: 6px 0 0; font-size: 13px; font-weight: 600; line-height: 1.75; color: #f5f5f5; opacity: .7; }

.hm-actions { display: flex; gap: 10px; margin-top: 18px; }
.mg-hm-btn {
  flex: 1; padding: 11px 10px; border-radius: 12px; border: 1px solid #3d3d3d;
  font-weight: 800; font-size: 14px; cursor: pointer;
  box-shadow: none;
  transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
  &:hover { transform: translate(-1px,-2px); }
  &:active { transform: translate(1px,1px); }
}
.mg-hm-btn.primary { background: linear-gradient(135deg, #ff4f9a, #ff2d7f); color: #fff; }

@keyframes mgHmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mgHmPop { 0% { opacity: 0; transform: scale(.94) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .mg-hm-ovl, .mg-hm-panel { animation: mgHmFade .16s ease-out both; }
  .mg-hm-btn { transition: none; &:hover, &:active { transform: none; } }
}
</style>