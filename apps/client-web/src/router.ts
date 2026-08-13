import { createRouter, createWebHistory } from 'vue-router'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'
import type { InkRouter } from '@inkcre/ui-web'
import type { InfoBaseRoute, InfoBaseRouter } from '@inkcre/core'
import infoBaseList from '@/views/info-base/list/list.vue'
import sources from '@/views/sources/sources.vue'
import source from '@/views/sources/source/source.vue'
import job from '@/views/jobs/job/job.vue'
import extensions from '@/views/extensions/extensions.vue'
import infoBaseGraph from '@/views/info-base/graph/graph.vue'
import settings from '@/views/settings/settings.vue'
import { computed } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'InfoBaseListOverview',
      component: infoBaseList,
      meta: { title: 'Info Base' },
    },
    {
      path: '/info-base/list/blocks/:block/content',
      name: 'InfoBaseListSolvedContent',
      component: infoBaseList,
      meta: { title: 'Info Base' },
    },
    {
      path: '/info-base/list/blocks/:block',
      name: 'InfoBaseListBlock',
      component: infoBaseList,
      meta: { title: 'Info Base' },
    },
    {
      path: '/sources',
      name: 'Sources',
      component: sources,
    },
    {
      path: '/jobs/:id',
      name: 'Job',
      component: job,
    },
    {
      path: '/sources/:id',
      name: 'Source',
      component: source,
    },
    {
      path: '/extensions',
      name: 'Extensions',
      component: extensions,
    },
    {
      path: '/info-base/graph',
      name: 'InfoBaseGraphOverview',
      component: infoBaseGraph,
      meta: { title: 'Info Base' },
    },
    {
      path: '/info-base/graph/blocks/:block/content',
      name: 'InfoBaseGraphSolvedContent',
      component: infoBaseGraph,
      meta: { title: 'Info Base' },
    },
    {
      path: '/info-base/graph/blocks/:block',
      name: 'InfoBaseGraphBlock',
      component: infoBaseGraph,
      meta: { title: 'Info Base' },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: settings,
    },
  ],
})

export default router

export function createInkRouterAdapter(
  router: Router,
  route: RouteLocationNormalizedLoaded
): InkRouter {
  return {
    currentPath: computed(() => route.path),
    currentName: computed(
      () => (route.meta.title as string | undefined) ?? (route.name as string) ?? null
    ),
  }
}

function parseBlockRef(value: unknown): number | null {
  const block = typeof value === 'string' && value !== '' ? Number(value) : Number.NaN
  return Number.isSafeInteger(block) ? block : null
}

export function createInfoBaseRouterAdapter(router: Router): InfoBaseRouter {
  function surface(name: unknown): 'list' | 'graph' | null {
    if (typeof name !== 'string') return null
    if (name.startsWith('InfoBaseList')) return 'list'
    if (name.startsWith('InfoBaseGraph')) return 'graph'
    return null
  }

  return {
    current: computed<InfoBaseRoute | null>(() => {
      const current = router.currentRoute.value
      const currentSurface = surface(current.name)
      if (currentSurface === null) return null
      if (current.name === `InfoBase${currentSurface === 'list' ? 'List' : 'Graph'}Overview`) {
        return { name: 'overview' }
      }
      const block = parseBlockRef(current.params.block)
      if (block === null) return null
      return String(current.name).endsWith('Block')
        ? { name: 'block', block }
        : { name: 'solved-content', block }
    }),
    async push(route) {
      const current = router.currentRoute.value
      const currentSurface = surface(current.name) ?? 'list'
      const prefix = currentSurface === 'list' ? 'InfoBaseList' : 'InfoBaseGraph'
      if (route.name === 'overview') {
        await router.push({ name: `${prefix}Overview`, query: current.query })
        return
      }
      await router.push({
        name: `${prefix}${route.name === 'block' ? 'Block' : 'SolvedContent'}`,
        params: { block: String(route.block) },
        query: current.query,
      })
    },
    back() {
      router.back()
    },
  }
}
