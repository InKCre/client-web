import { createRouter, createWebHistory } from 'vue-router'
import InKCreWorkspace from '@/views/workspaceView.vue'
import FocusExplorerView from '@/views/focusExplorerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: InKCreWorkspace,
    },
    {
      path: '/workspace',
      name: 'Workspace',
      component: InKCreWorkspace,
    },
    {
      path: '/focus/:blockId',
      name: 'FocusExplorer',
      component: FocusExplorerView,
      props: (route) => ({ blockId: Number(route.params.blockId) }),
    },
  ],
})

export default router
