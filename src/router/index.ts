import { createRouter, createWebHistory } from "vue-router";
import StartView from "@/views/start.vue";
import FocusExplorerView from "@/views/focusExplorerView.vue";
import ExtensionsView from "@/views/extensionsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Home",
      component: StartView,
    },
    {
      path: "/focus/:blockId",
      name: "FocusExplorer",
      component: FocusExplorerView,
      props: (route) => ({ blockId: Number(route.params.blockId) }),
    },
    {
      path: "/extensions",
      name: "Extensions",
      component: ExtensionsView,
    },
  ],
});

export default router;
