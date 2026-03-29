import "./assets/base.css";
import "element-plus/dist/index.css";
import "./assets/js/fontRem.js";

import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./lang/i18n";
import router from "./router";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import ProcessList from "./components/ProcessList.vue";

const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(ElementPlus);
app.component("ProcessList", ProcessList);

const pinia = createPinia();
app.use(pinia);
app.mount("#app");
