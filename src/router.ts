import { createRouter, createWebHistory } from "vue-router";
import start from "@/views/start/start.vue";
import sources from "@/views/sources/sources.vue";
import extensions from "@/views/extensions/extensions.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "InKCre",
      component: start,
    },
    {
      path: "/sources",
      name: "Sources",
      component: sources,
    },
    {
      path: "/extensions",
      name: "Extensions",
      component: extensions,
    },
  ],
});

export default router;
