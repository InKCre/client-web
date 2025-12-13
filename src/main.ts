import { createInstance } from "@module-federation/runtime";
import { createApp } from "vue";

import VueKonva from "vue-konva";
import App from "./App.vue";
import i18n from "./locales";
import router from "./router";
import store from "./stores";
import "@inkcre/web-design/styles";

// 导入全局样式
import "uno.css";

const app = createApp(App);

app.use(VueKonva);
app.use(i18n);
app.use(store);
app.use(router);

createInstance({
  name: "host",
  remotes: [],
});

app.mount("#app");
