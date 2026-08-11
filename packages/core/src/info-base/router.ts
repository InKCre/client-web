import type { DeepReadonly, Ref } from 'vue'

import type { BlockRef } from './block'

export type InfoBaseRoute =
  | { name: 'overview' }
  | { name: 'block'; block: BlockRef }
  | { name: 'solved-content'; block: BlockRef }

export interface InfoBaseRouter {
  readonly current: DeepReadonly<Ref<InfoBaseRoute | null>>
  push(route: InfoBaseRoute): void | Promise<void>
  back(): void | Promise<void>
}

let implementation: InfoBaseRouter | null = null

export function setInfoBaseRouter(router: InfoBaseRouter): void {
  implementation = router
}

export function getInfoBaseRouter(): InfoBaseRouter {
  if (!implementation) {
    throw new Error('InfoBaseRouter is not configured. Call setInfoBaseRouter() first.')
  }
  return implementation
}
