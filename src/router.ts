import { createRouter, createWebHistory } from "vue-router";
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import type { InkRouter } from "@inkcre/web-design";
import start from "@/views/start/start.vue";
import sources from "@/views/sources/sources.vue";
import sourceCollectJob from "@/views/sources/sourceCollectJob/sourceCollectJob.vue";
import extensions from "@/views/extensions/extensions.vue";
import { computed } from "vue";

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
      path: "/sources/collectJob/:id",
      name: "SourceCollectJob",
      component: sourceCollectJob,
    },
    {
      path: "/extensions",
      name: "Extensions",
      component: extensions,
    },
  ],
});

export default router;

export function createInkRouterAdapter(
  router: Router,
  route: RouteLocationNormalizedLoaded
): InkRouter {
  return {
    currentPath: computed(() => route.path),
    currentName: computed(() => route.name),
  };
}
