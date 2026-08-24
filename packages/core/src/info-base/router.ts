import type { DeepReadonly, Ref } from 'vue'

import type { BlockRef } from './block'
import type { RelationRef } from './relation'

export interface InfoBaseSceneAddress {
  focal_block?: BlockRef
  focal_relation?: RelationRef
  path_from?: BlockRef
  path_to?: BlockRef
  q?: string
}

export type InfoBaseRoute =
  | ({ name: 'overview' } & InfoBaseSceneAddress)
  | ({ name: 'block'; block: BlockRef } & InfoBaseSceneAddress)
  | ({ name: 'relation'; relation: RelationRef } & InfoBaseSceneAddress)
  | ({ name: 'solved-content'; block: BlockRef } & InfoBaseSceneAddress)

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
