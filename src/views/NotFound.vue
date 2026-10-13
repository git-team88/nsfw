<template>
  <div class="nf-page">
    <div class="nf-card">
      <p class="nf-code">404</p>
      <h1 class="nf-title">{{ t('notFound.title') }}</h1>
      <p class="nf-sub">{{ t('notFound.desc') }}</p>
      <div class="nf-actions">
        <router-link class="nf-btn" to="/">{{ t('notFound.back') }}</router-link>
      </div>
      <ul class="nf-links">
        <li><a href="/guide.html">{{ t('notFound.guide') }}</a></li>
        <li><span class="nf-text">{{ t('notFound.terms') }}</span></li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// —— 404 页的 SEO 责任 ——
// 1. robots 改为 noindex：404 页不该被收录。
// 2. 带 seo-status 标记：seo-server.mjs 检测到它就对爬虫返回真实 404 状态码，
//    否则未知 URL 会「200 + 首页内容」，形成无限重复内容（soft 404）。
// 3. 离开本页时必须恢复/清掉这两处 —— 否则 noindex 会残留到下一个页面，
//    把正常页面也变成 noindex（这是比 404 更严重的事故）。
const robotsEl = ref<HTMLMetaElement | null>(null);
const statusEl = ref<HTMLMetaElement | null>(null);
let prevRobots: string | null = null;

// 标题跟当前站点语言走，切换语言时同步更新
watch(locale, () => { document.title = t('notFound.pageTitle'); }, { immediate: true });

onMounted(() => {
  let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (robots) {
    prevRobots = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex, follow');
  } else {
    robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, follow';
    document.head.appendChild(robots);
  }
  robotsEl.value = robots;

  const status = document.createElement('meta');
  status.name = 'seo-status';
  status.content = '404';
  document.head.appendChild(status);
  statusEl.value = status;
});

onUnmounted(() => {
  if (robotsEl.value) {
    if (prevRobots !== null) robotsEl.value.setAttribute('content', prevRobots);
    else robotsEl.value.remove();
  }
  statusEl.value?.remove();
});
</script>

<style scoped>
.nf-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #1a1a1a;
}
.nf-card {
  max-width: 720px;
  width: 100%;
  background: #2c2c2c;
  border: 1px solid #3d3d3d;
  border-radius: 16px;
  padding: 64px 56px;
  text-align: center;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
}
.nf-code {
  margin: 0;
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 23px rgba(255,50,140,0.35);
}
.nf-title {
  margin: 24px 0 12px;
  font-size: 28px;
  font-weight: 700;
  color: #f5f5f5;
}
.nf-sub {
  margin: 0 0 34px;
  font-size: 16px;
  line-height: 1.7;
  color: #cfcfcf;
}
.nf-actions {
  margin-bottom: 28px;
}
.nf-btn {
  display: inline-block;
  padding: 14px 36px;
  border-radius: 999px;
  background: linear-gradient(145deg, #ff65ab, #f02c80);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 0 23px rgba(255,50,140,0.45);
  transition: transform .15s ease, box-shadow .15s ease;
}
.nf-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 30px rgba(255,50,140,0.65);
}
.nf-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 18px;
  justify-content: center;
}
.nf-links a {
  font-size: 14px;
  color: #8a8a8a;
  text-decoration: none;
  border-bottom: 1px solid #3d3d3d;
}
.nf-links .nf-text {
  font-size: 14px;
  color: #8a8a8a;
  cursor: default;
}
.nf-links a:hover {
  color: #ff4f9a;
  border-bottom-color: #ff4f9a;
}
</style>
