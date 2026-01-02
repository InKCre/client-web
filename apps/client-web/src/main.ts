import { loadConfig, saveConfig } from "./config";
await loadConfig();

import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./locales";
import router from "./router";
import store from "./stores";

// 样式
import "uno.css";
import "@inkcre/web-design/styles";
import "@vue-flow/core/dist/style.css";

const app = createApp(App);

app.use(i18n);
app.use(store);
app.use(router);
app.mount("#app");

// Initialize built-in storages and resolvers
import "@/business/info-base/storages";
import "@/business/info-base/resolvers";

// Initialize Extension
import "@/business/mf-plugins";
import { Extension } from "@/business/extension";
Extension.startup().catch((error) => {
  console.error("[Extension] Startup failed:", error);
});

window.addEventListener("beforeunload", () => {
  Extension.shutdown();
  saveConfig();
});
