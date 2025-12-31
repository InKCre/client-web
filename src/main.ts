import { createApp } from "vue";

import App from "./App.vue";
import i18n from "./locales";
import router from "./router";
import store from "./stores";
import { configManager } from "./config";

configManager.load();

// 样式
import "uno.css";
import "@inkcre/web-design/styles";
import "@vue-flow/core/dist/style.css";

const app = createApp(App);

app.use(i18n);
app.use(store);
app.use(router);

import { initBuiltinStorages } from "@/business/info-base/storages";
import { initBuiltinResolvers } from "@/business/info-base/resolvers";

// Module Federation runtime with plugins (must be imported before extensions)
import "@/business/mf-plugins";

import { Extension } from "@/business/extension";

initBuiltinStorages();
initBuiltinResolvers();

app.mount("#app");

// Extension lifecycle
Extension.startup().catch((error) => {
  console.error("[Extension] Startup failed:", error);
});

window.addEventListener("beforeunload", () => {
  Extension.shutdown();
  configManager.save();
});
