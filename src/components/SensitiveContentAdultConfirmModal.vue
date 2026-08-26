<template>
  <div class="mg-hm-ovl" role="dialog" aria-modal="true">
    <div class="mg-hm-panel">
      <div class="hm-decal" aria-hidden="true"></div>

      <button class="hm-close" @click="handleClose" :aria-label="t('home.sensitiveContentAdultConfirm.cancel')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="hm-badge">
        <span class="badge-icon">🔞</span>
        {{ t('home.sensitiveContent') }}
      </div>

      <h3 class="hm-title">{{ t('home.sensitiveContentAdultConfirm.title') }}</h3>

      <div class="hm-actions">
        <button class="mg-hm-btn primary" @click="handleConfirm">{{ t('home.sensitiveContentAdultConfirm.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
  confirm: [isAdult: boolean];
}>();

const handleClose = () => emit('close');

// 单按钮：用户自我声明已满18岁
const handleConfirm = () => emit('confirm', true);
</script>

<style scoped lang="scss">
$yellow: #FFD23F;

.mg-hm-ovl {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(0, 0, 0, 0.5);
  animation: mgHmFade .18s ease-out both;
}

.mg-hm-panel {
  position: relative;
  width: min(420px, 92%);
  padding: 22px 24px;
  background: #1a1a1a;
  border: 1px solid #ff9aca;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
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
  background: #1a1a1a; border: 1px solid #ff9aca; box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.hm-badge {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: 12px;
  padding: 3px 12px; border-radius: 999px;
  background: $yellow; color: #1a1a1a; border: 1px solid #ff9aca;
  font-weight: 800; font-size: 11px; letter-spacing: .06em;
  .badge-icon { font-size: 13px; }
}

.hm-title { margin: 0; font-size: 18px; font-weight: 900; color: #f5f5f5; line-height: 1.5; }

.hm-actions { display: flex; gap: 10px; margin-top: 20px; }
.mg-hm-btn {
  flex: 1; padding: 11px 10px; border-radius: 18px; border: 1px solid #ff9aca;
  font-weight: 800; font-size: 14px; cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 50, 140, 0.5);
  transition: box-shadow 0.15s ease-out;
  &:hover { box-shadow: 0 0 28px rgba(255, 50, 140, 0.65); }
  &:active { box-shadow: 0 0 20px rgba(255, 50, 140, 0.5); }
}
.mg-hm-btn.primary { background: linear-gradient(135deg, #ff4f9a, #ff2d7f); color: #f5f5f5; }

@keyframes mgHmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mgHmPop { 0% { opacity: 0; transform: scale(.94) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .mg-hm-ovl, .mg-hm-panel { animation: mgHmFade .16s ease-out both; }
  .mg-hm-btn { transition: none; &:hover, &:active { transform: none; } }
}
</style>
