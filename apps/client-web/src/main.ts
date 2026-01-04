// Initialize core package
import { initializeCore } from "./core";
import { localStorageAdapter } from "@inkcre/core";
await initializeCore();

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

// Register built-in storages and resolvers
import "@/storages";
import "@/resolvers";

// Initialize Extension
import { Extension, saveConfig } from "@inkcre/core";
Extension.startup().catch((error) => {
  console.error("[Extension] Startup failed:", error);
});

window.addEventListener("beforeunload", () => {
  Extension.shutdown();
  saveConfig(localStorageAdapter);
});
