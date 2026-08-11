import { createRouter, createWebHistory } from 'vue-router'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'
import type { InkRouter } from '@inkcre/ui-web'
import type { InfoBaseRoute, InfoBaseRouter } from '@inkcre/core'
import start from '@/views/start/start.vue'
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
      name: 'InKCre',
      component: start,
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
    },
    {
      path: '/info-base/graph/blocks/:block/content',
      name: 'InfoBaseGraphSolvedContent',
      component: infoBaseGraph,
    },
    {
      path: '/info-base/graph/blocks/:block',
      name: 'InfoBaseGraphBlock',
      component: infoBaseGraph,
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
    currentName: computed(() => (route.name as string) || null),
  }
}

function parseBlockRef(value: unknown): number | null {
  const block = typeof value === 'string' && value !== '' ? Number(value) : Number.NaN
  return Number.isSafeInteger(block) ? block : null
}

export function createInfoBaseRouterAdapter(router: Router): InfoBaseRouter {
  return {
    current: computed<InfoBaseRoute | null>(() => {
      const current = router.currentRoute.value
      if (current.name === 'InfoBaseGraphOverview') return { name: 'overview' }
      if (current.name !== 'InfoBaseGraphBlock' && current.name !== 'InfoBaseGraphSolvedContent') {
        return null
      }
      const block = parseBlockRef(current.params.block)
      if (block === null) return null
      return current.name === 'InfoBaseGraphBlock'
        ? { name: 'block', block }
        : { name: 'solved-content', block }
    }),
    async push(route) {
      if (route.name === 'overview') {
        await router.push({ name: 'InfoBaseGraphOverview' })
        return
      }
      await router.push({
        name: route.name === 'block' ? 'InfoBaseGraphBlock' : 'InfoBaseGraphSolvedContent',
        params: { block: String(route.block) },
      })
    },
    back() {
      router.back()
    },
  }
}
