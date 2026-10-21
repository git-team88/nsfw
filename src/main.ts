import "./assets/base.css";

import { createApp } from "vue";
import App from "./App.vue";
import i18n, { loadLocaleMessages, preloadOtherLocales } from "./lang/i18n";
import router from "./router";
import { createPinia } from "pinia";
import ProcessList from "./components/ProcessList.vue";
import { cleanupExpiredViews } from "./util/viewTracker";

import 'swiper/swiper-bundle.css';

// 清理浏览上报的过期缓存：放在启动时跑一次，
// 这样即使用户之后再没进过个人主页 / 合集详情，残留的 key 也不会一直留着。
cleanupExpiredViews();

const app = createApp(App);

app.use(i18n);
app.use(router);
app.component("ProcessList", ProcessList);

const pinia = createPinia();
app.use(pinia);

// 语言包按需加载（SEO T17）：等当前语言装好再挂载，避免首屏闪一下 key；
// 其余语言在空闲时预加载（SEO 预渲染只需要当前这一种，不预加载）。
loadLocaleMessages(i18n.global.locale.value as string).then(() => {
  app.mount("#app");
  if (!(window as any).__SEO_PRERENDER__) preloadOtherLocales();
});
