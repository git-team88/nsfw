import "./assets/base.css";
import "element-plus/dist/index.css";

import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./lang/i18n";
import router from "./router";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import ProcessList from "./components/ProcessList.vue";
import { cleanupExpiredViews } from "./util/viewTracker";

import 'swiper/swiper-bundle.css';

// 清理浏览上报的过期缓存：放在启动时跑一次，
// 这样即使用户之后再没进过个人主页 / 合集详情，残留的 key 也不会一直留着。
cleanupExpiredViews();

const app = createApp(App);

app.use(i18n);
app.use(router);
app.use(ElementPlus);
app.component("ProcessList", ProcessList);

const pinia = createPinia();
app.use(pinia);
app.mount("#app");
