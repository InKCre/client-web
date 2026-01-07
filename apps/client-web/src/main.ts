import { createApp } from "vue";
import App from "./App.vue";
import i18n from "./locales";
import router from "./router";
import { store } from "@inkcre/core";

// 样式
import "uno.css";
import "@inkcre/web-design/styles";
import "@vue-flow/core/dist/style.css";

const app = createApp(App);

app.use(i18n);
app.use(store);
app.use(router);
app.mount("#app");

// Initialize core package
import { initializeCore } from "./core";
await initializeCore();

// Initialize Extension
import { Extension, configStore, localStorageAdapter } from "@inkcre/core";
Extension.startup().catch((error) => {
  console.error("[Extension] Startup failed:", error);
});

window.addEventListener("beforeunload", () => {
  Extension.shutdown();
  // Persist both meta and client config before unload
  configStore.saveMeta(localStorageAdapter);
  configStore.saveClient(localStorageAdapter);
});
