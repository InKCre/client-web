import { createRouter, createWebHistory } from "vue-router";
import StartView from "@/views/start.vue";
import ExtensionsView from "@/views/extensionsView.vue";
import SettingsView from "@/views/settingsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: StartView,
    },
    {
      path: "/extensions",
      name: "Extensions",
      component: ExtensionsView,
    },
    {
      path: "/settings",
      name: "Settings",
      component: SettingsView,
    },
  ],
});

export default router;
