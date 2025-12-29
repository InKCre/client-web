import { createInstance } from "@module-federation/runtime";
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

import { registerBuiltinStorages } from "@/business/info-base/storages";
import { registerBuiltinResolvers } from "@/business/info-base/resolvers";

registerBuiltinStorages();
registerBuiltinResolvers();

createInstance({
  name: "host",
  remotes: [],
});

app.mount("#app");
