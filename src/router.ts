import { createRouter, createWebHistory } from "vue-router";
import start from "@/views/start/start.vue";
import sources from "@/views/sources/sources.vue";

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
  ],
});

export default router;
