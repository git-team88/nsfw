<template>
  <div class="mg-nsfw-panel">
    <img class="nsfw-bg" src="@/assets/images/detail/lock_pic.png" alt="" />
    <div class="mg-nsfw-card">
      <template v-if="isChina">
        <!-- 中国大陆：不支持查看敏感内容 -->
        <div class="nsfw-badge"><span class="badge-icon">🔒</span></div>
        <p class="nsfw-desc">{{ t('detail.lock.chinaNotSupported') }}</p>
      </template>
      <template v-else-if="isTeenager">
        <!-- 未成年/未登录：确认满18岁，缓存 is_adult 后开启浏览 -->
        <div class="nsfw-badge"><span class="badge-icon">🔞</span></div>
        <p class="nsfw-desc">{{ t('detail.lock.sensitiveContent') }}</p>
        <button class="mg-nsfw-btn" @click="emit('confirmAdult')">{{ t('detail.lock.profileSettings') }}</button>
      </template>
      <template v-else>
        <!-- 成年但首页敏感开关关闭：开启 NSFW 浏览（缓存"是否允许敏感内容"） -->
        <div class="nsfw-badge"><span class="badge-icon">🔞</span></div>
        <h3 class="nsfw-title">{{ t('detail.lock.nsfwBrowseTitle') }}</h3>
        <p class="nsfw-desc" v-html="t('detail.lock.nsfwBrowseDesc')"></p>
        <button class="mg-nsfw-btn" @click="emit('enable')">{{ t('detail.lock.enableNsfw') }}</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{ isTeenager?: boolean; isChina?: boolean }>();

const emit = defineEmits<{ enable: []; confirmAdult: [] }>();
</script>

<style scoped lang="scss">
$ink: #161122;
$paper: #FFFDF7;
$pink: #FF4D8D;
$yellow: #FFD23F;

.mg-nsfw-panel {
  position: relative;
  width: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;

  .nsfw-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    z-index: 0;
  }

  .mg-nsfw-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    max-width: 460px;
    padding: 32px 28px;
    background: $paper;
    border: 3px solid $ink;
    border-radius: 18px;
    box-shadow: 8px 8px 0 rgba(22, 17, 34, 0.18);
    box-sizing: border-box;
  }

  .nsfw-badge {
    display: inline-flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; margin-bottom: 14px;
    border-radius: 999px; background: $yellow; border: 2px solid $ink;
    box-shadow: 2px 2px 0 $ink;
    .badge-icon { font-size: 22px; }
  }

  .nsfw-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 900;
    color: $ink;
  }

  .nsfw-desc {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $ink;
    opacity: .7;
    line-height: 1.7;
  }

  .mg-nsfw-btn {
    margin-top: 20px;
    min-width: 220px;
    padding: 12px 24px;
    background: $pink;
    color: #fff;
    border: 2px solid $ink;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 4px 4px 0 $ink;
    transition: transform .15s cubic-bezier(.34,1.56,.64,1), box-shadow .15s ease-out;
    &:hover { transform: translate(-1px,-2px); box-shadow: 6px 7px 0 rgba(22,17,34,.4); }
    &:active { transform: translate(1px,1px); box-shadow: 2px 2px 0 rgba(22,17,34,.4); }
  }
}

@media (prefers-reduced-motion: reduce) {
  .mg-nsfw-btn { transition: none; &:hover, &:active { transform: none; } }
}
</style>
