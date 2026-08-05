<template>
  <div class="mg-hm-ovl" @click.self="handleClose" role="dialog" aria-modal="true">
    <div class="mg-hm-panel">
      <div class="hm-decal" aria-hidden="true"></div>

      <button class="hm-close" @click="handleClose" :aria-label="t('home.underageNoBirthday.cancel')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#161122" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>

      <div class="hm-badge">
        <span class="badge-icon">🔞</span>
        {{ t('home.mode.unlimited') }}
      </div>

      <h3 class="hm-title">{{ t('home.underageNoBirthday.title') }}</h3>
      <p class="hm-body">{{ t('home.underageNoBirthday.description') }}</p>

      <div class="hm-radios">
        <button class="hm-radio" :class="{ active: isAdult === true }" @click="isAdult = true">
          <img v-if="isAdult === true" class="radio-icon" src="@/assets/images/header/check_active.png" alt="" />
          <img v-else class="radio-icon" src="@/assets/images/header/check.png" alt="" />
          <span class="txt">{{ t('home.underageNoBirthday.yes') }}</span>
        </button>
        <button class="hm-radio" :class="{ active: isAdult === false }" @click="isAdult = false">
          <img v-if="isAdult === false" class="radio-icon" src="@/assets/images/header/check_active.png" alt="" />
          <img v-else class="radio-icon" src="@/assets/images/header/check.png" alt="" />
          <span class="txt">{{ t('home.underageNoBirthday.no') }}</span>
        </button>
      </div>

      <div class="hm-actions">
        <button class="mg-hm-btn ghost" @click="handleClose">{{ t('home.underageNoBirthday.cancel') }}</button>
        <button class="mg-hm-btn primary" :class="{ disabled: isAdult === null }" @click="handleConfirm">{{ t('home.underageNoBirthday.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 默认选中「否」
const isAdult = ref<boolean | null>(false);

const emit = defineEmits<{
  close: [];
  confirm: [isAdult: boolean];
}>();

const handleClose = () => emit('close');

const handleConfirm = () => {
  if (isAdult.value === null) return;
  emit('confirm', isAdult.value);
};
</script>

<style scoped lang="scss">
$ink: #161122;
$paper: #FFFDF7;
$pink: #FF4D8D;
$yellow: #FFD23F;

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

.hm-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #fff;
  border: 2px solid #161122;
  box-shadow: 2px 2px 0 #161122;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  transition: transform .2s;

  &:hover { transform: scale(1.1) rotate(90deg); }
}

.hm-badge {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: 12px;
  padding: 3px 12px; border-radius: 999px;
  background: $yellow; color: $ink; border: 2px solid $ink;
  font-weight: 800; font-size: 11px; letter-spacing: .06em;
  .badge-icon { font-size: 13px; }
}

.hm-title { margin: 0; font-size: 19px; font-weight: 900; color: $ink; }
.hm-body { margin: 10px 0 0; font-size: 13px; font-weight: 600; line-height: 1.75; color: $ink; opacity: .7; }

.hm-radios {
  display: flex; gap: 28px; margin-top: 16px;
  .hm-radio {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0;
    background: none; border: none; box-shadow: none;
    font-weight: 800; font-size: 14px; color: $ink; cursor: pointer;
    .radio-icon { width: 20px; height: 20px; flex-shrink: 0; display: block; }
  }
}

.hm-actions { display: flex; gap: 10px; margin-top: 16px; }
.mg-hm-btn {
  flex: 1; padding: 11px 10px; border-radius: 12px; border: 2px solid $ink;
  font-weight: 800; font-size: 14px; cursor: pointer;
  box-shadow: 2px 2px 0 $ink;
  transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
  &:hover { transform: translate(-1px,-2px); box-shadow: 4px 5px 0 rgba(22,17,34,.4); }
  &:active { transform: translate(1px,1px); box-shadow: 1px 1px 0 rgba(22,17,34,.4); }
}
.mg-hm-btn.ghost { background: #fff; color: $ink; &:hover { color: $pink; } }
.mg-hm-btn.primary { background: $pink; color: #fff;
  &.disabled { opacity: .5; cursor: not-allowed; &:hover, &:active { transform: none; box-shadow: 2px 2px 0 $ink; } }
}

@keyframes mgHmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes mgHmPop { 0% { opacity: 0; transform: scale(.94) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .mg-hm-ovl, .mg-hm-panel { animation: mgHmFade .16s ease-out both; }
  .mg-hm-btn { transition: none; &:hover, &:active { transform: none; } }
}
</style>
