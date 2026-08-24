<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import {
  VueFlow,
  useNodesInitialized,
  useVueFlow,
  type GraphNode,
  type NodeDragEvent,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { InkButton, InkLoading } from '@inkcre/ui-web'
import {
  getInfoBaseRouter,
  GraphNavigationRetrievalManager,
  LexicalRetrievalManager,
  ResolverCache,
  type Block,
  type GraphDirection,
  type GraphModel,
  type InfoBaseRoute,
  type Relation,
} from '@inkcre/core'

import BlockNodeComponent from '@/components/info-base/BlockNode/BlockNode.vue'
import RelationEdgeComponent from '@/components/info-base/RelationEdge/RelationEdge.vue'
import BlockInspectorPopup from '@/components/info-base/BlockInspectorPopup/BlockInspectorPopup.vue'
import RelationInspectorPopup from '@/components/info-base/RelationInspectorPopup/RelationInspectorPopup.vue'
import SolvedContentPopup from '@/components/info-base/SolvedContentPopup/SolvedContentPopup.vue'
import { blockNode, relationEdge, type BlockNode, type RelationEdge } from './graph-model'
import { openRecallSearch } from '@/components/recall/recall-search'

type SceneScale = 'compact' | 'standard' | 'broad'
type SceneStatus = 'loading' | 'ready' | 'empty' | 'missing' | 'not-found' | 'limit' | 'error'

const SCALE_LIMITS: Record<SceneScale, number> = { compact: 8, standard: 20, broad: 50 }
const infoBaseRouter = getInfoBaseRouter()
const currentRoute = computed(() => infoBaseRouter.current.value)
const nodes = shallowRef<BlockNode[]>([])
const edges = shallowRef<RelationEdge[]>([])
const status = ref<SceneStatus>('loading')
const scale = ref<SceneScale>('standard')
const direction = ref<GraphDirection>('both')
const previewReady = ref(false)
const pendingCamera = ref(false)
const positionCache = new Map<string, { x: number; y: number }>()
let generation = 0

const { fitView, zoomIn, zoomOut, getNodes, onMoveStart } = useVueFlow()
const nodesInitialized = useNodesInitialized()
onMoveStart(() => {
  pendingCamera.value = false
})

const sceneAddress = computed(() => {
  const route = currentRoute.value
  if (!route) return null
  if (route.path_from !== undefined && route.path_to !== undefined) {
    return { type: 'path' as const, from: route.path_from, to: route.path_to }
  }
  if (route.focal_relation !== undefined) {
    return { type: 'relation' as const, relation: route.focal_relation }
  }
  if (route.focal_block !== undefined) {
    return { type: 'block' as const, block: route.focal_block }
  }
  if (route.q) return { type: 'recall' as const, query: route.q }
  if (route.name === 'relation') return { type: 'relation' as const, relation: route.relation }
  if (route.name === 'block' || route.name === 'solved-content') {
    return { type: 'block' as const, block: route.block }
  }
  return { type: 'random' as const }
})

const sceneKey = computed(() => JSON.stringify(sceneAddress.value))
const focalBlock = computed(() => {
  const address = sceneAddress.value
  return address?.type === 'block' ? address.block : null
})
const focalRelation = computed(() => {
  const address = sceneAddress.value
  return address?.type === 'relation' ? address.relation : null
})

function activeRelation(relation: Relation): boolean {
  if (direction.value === 'both') return true
  if (focalRelation.value === relation.id) return true
  if (focalBlock.value === null) return true
  return direction.value === 'out'
    ? relation.from_ === focalBlock.value
    : relation.to_ === focalBlock.value
}

function applyPresentation(): void {
  const activeBlocks = new Set<number>()
  if (focalBlock.value !== null) activeBlocks.add(focalBlock.value)
  for (const edge of edges.value) {
    if (activeRelation(edge.data.relation)) {
      activeBlocks.add(edge.data.relation.from_)
      activeBlocks.add(edge.data.relation.to_)
    }
  }
  edges.value = edges.value.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      focal: edge.data.relation.id === focalRelation.value,
      muted: !activeRelation(edge.data.relation),
    },
  }))
  nodes.value = nodes.value.map((node) => ({
    ...node,
    data: {
      ...node.data,
      focal: node.data.block.id === focalBlock.value,
      muted: direction.value !== 'both' && !activeBlocks.has(node.data.block.id),
    },
  }))
}

function setGraph(graph: GraphModel): void {
  const incident = new Map<number, Relation[]>()
  for (const relation of graph.relations) {
    incident.set(relation.from_, [...(incident.get(relation.from_) ?? []), relation])
    incident.set(relation.to_, [...(incident.get(relation.to_) ?? []), relation])
  }
  nodes.value = graph.blocks.map((block) =>
    blockNode(block, {
      focal: block.id === focalBlock.value,
      muted: false,
      position: positionCache.get(String(block.id)),
    })
  )
  edges.value = graph.relations.map((relation) =>
    relationEdge(relation, {
      focal: relation.id === focalRelation.value,
      muted: false,
    })
  )
  applyPresentation()
  void loadPreviews(graph.blocks, incident, generation)
}

async function loadPreviews(
  blocks: Block[],
  incident: Map<number, Relation[]>,
  current: number
): Promise<void> {
  previewReady.value = false
  let index = 0
  async function worker(): Promise<void> {
    while (index < blocks.length) {
      const block = blocks[index++]!
      try {
        const resolver = await ResolverCache.getResolver(block, incident.get(block.id) ?? [])
        const solvedContent = await resolver.getSolvedContent({ materializeMissing: false })
        if (current !== generation) return
        nodes.value = nodes.value.map((node) =>
          node.data.block.id === block.id
            ? {
                ...node,
                data: { ...node.data, resolver, solvedContent, previewStatus: 'success' },
              }
            : node
        )
      } catch (cause) {
        if (current !== generation) return
        console.error(`[InfoBase] Failed to resolve preview for Block ${block.id}.`, cause)
        nodes.value = nodes.value.map((node) =>
          node.data.block.id === block.id
            ? { ...node, data: { ...node.data, previewStatus: 'error' } }
            : node
        )
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, blocks.length) }, () => worker()))
  if (current === generation) previewReady.value = true
}

async function loadScene(): Promise<void> {
  const current = ++generation
  status.value = 'loading'
  previewReady.value = false
  pendingCamera.value = true
  try {
    const address = sceneAddress.value
    if (!address) return
    if (address.type === 'random') {
      const block = await GraphNavigationRetrievalManager.getRandomBlock()
      if (current !== generation) return
      if (!block) {
        nodes.value = []
        edges.value = []
        status.value = 'empty'
        return
      }
      await infoBaseRouter.push({ name: 'overview', focal_block: block.id })
      return
    }

    let graph: GraphModel | null = null
    if (address.type === 'block') {
      const result = await GraphNavigationRetrievalManager.getBlockNeighborhood(address.block, {
        direction: 'both',
        limit: SCALE_LIMITS[scale.value],
      })
      graph = result?.graph ?? null
      if (!graph) status.value = 'missing'
    } else if (address.type === 'relation') {
      const result = await GraphNavigationRetrievalManager.getRelationNeighborhood(address.relation)
      graph = result?.graph ?? null
      if (!graph) status.value = 'missing'
    } else if (address.type === 'path') {
      const result = await GraphNavigationRetrievalManager.findPath(address.from, address.to)
      if (result.status === 'found') graph = result.graph
      else status.value = result.status === 'not_found' ? 'not-found' : 'limit'
    } else {
      const result = await LexicalRetrievalManager.retrieve({ query: address.query, limit: 20 })
      graph = { blocks: result.matches.map((match) => match.block), relations: [] }
      if (graph.blocks.length === 0) status.value = 'empty'
    }
    if (current !== generation) return
    if (graph) {
      setGraph(graph)
      status.value = graph.blocks.length > 0 ? 'ready' : 'empty'
    } else {
      nodes.value = []
      edges.value = []
    }
  } catch (cause) {
    if (current !== generation) return
    console.error('[InfoBase] Failed to load Graph scene.', cause)
    nodes.value = []
    edges.value = []
    status.value = 'error'
  }
}

function layoutMeasuredNodes(): void {
  const measured = getNodes.value
  if (measured.length === 0) return
  const byId = new Map(measured.map((node) => [node.id, node]))
  const focalId =
    focalBlock.value !== null
      ? String(focalBlock.value)
      : (measured.find((node) => !positionCache.has(node.id))?.id ?? measured[0]!.id)
  const focalPosition = positionCache.get(focalId) ?? { x: 0, y: 0 }
  const neighbors = [...nodes.value]
    .filter((node) => node.id !== focalId && !positionCache.has(node.id))
    .sort((left, right) => Number(left.id) - Number(right.id))
  const measuredWidth = (node: GraphNode): number => {
    if (node.dimensions.width > 0) return node.dimensions.width
    return typeof node.width === 'number' ? node.width : 180
  }
  const maxWidth = Math.max(180, ...measured.map(measuredWidth))
  const radius = Math.max(280, (neighbors.length * (maxWidth + 80)) / (Math.PI * 2))
  nodes.value = nodes.value.map((node) => {
    const cached = positionCache.get(node.id)
    if (cached) return { ...node, position: cached }
    if (node.id === focalId) {
      positionCache.set(node.id, focalPosition)
      return { ...node, position: focalPosition }
    }
    const index = neighbors.findIndex((neighbor) => neighbor.id === node.id)
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, neighbors.length)
    const measuredNode = byId.get(node.id)
    const position = {
      x: focalPosition.x + Math.cos(angle) * radius - (measuredNode?.dimensions.width ?? 0) / 2,
      y: focalPosition.y + Math.sin(angle) * radius - (measuredNode?.dimensions.height ?? 0) / 2,
    }
    positionCache.set(node.id, position)
    return { ...node, position }
  })
}

async function realizeScene(): Promise<void> {
  await nextTick()
  layoutMeasuredNodes()
  await nextTick()
  if (!pendingCamera.value) return
  pendingCamera.value = false
  await fitView({
    nodes: nodes.value.map((node) => node.id),
    padding: 0.18,
    maxZoom: 1.25,
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260,
  })
}

watch([sceneKey, scale], () => void loadScene(), { immediate: true })
watch(direction, applyPresentation)
watch([nodesInitialized, previewReady], ([initialized, ready]) => {
  if (initialized && ready) void realizeScene()
})

function focusBlock(block: number): void {
  pendingCamera.value = true
  void infoBaseRouter.push({ name: 'overview', focal_block: block })
}

function focusRelation(relation: number): void {
  pendingCamera.value = true
  void infoBaseRouter.push({ name: 'overview', focal_relation: relation })
}

function inspectBlock(block: number): void {
  void infoBaseRouter.push({ name: 'block', block })
}

function inspectRelation(relation: number): void {
  void infoBaseRouter.push({ name: 'relation', relation })
}

function onNodeDragStop(event: NodeDragEvent): void {
  positionCache.set(event.node.id, { ...event.node.position })
}

function refocus(): void {
  pendingCamera.value = true
  void realizeScene()
}

function onRuminated(): void {
  void loadScene()
}

function isRoute(route: InfoBaseRoute | null, name: InfoBaseRoute['name']): boolean {
  return route?.name === name
}
</script>

<template>
  <main class="graph-view">
    <div class="graph-view__toolbar" aria-label="Graph navigation controls">
      <div class="graph-view__control-group" aria-label="Exploration scale">
        <button
          v-for="option in ['compact', 'standard', 'broad'] as SceneScale[]"
          :key="option"
          type="button"
          :aria-pressed="scale === option"
          @click="scale = option"
        >
          {{ option }}
        </button>
      </div>
      <div class="graph-view__control-group" aria-label="Relation direction emphasis">
        <button
          v-for="option in ['in', 'both', 'out'] as GraphDirection[]"
          :key="option"
          type="button"
          :aria-pressed="direction === option"
          @click="direction = option"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <div v-if="status === 'loading'" class="graph-view__state"><InkLoading /></div>
    <div v-else-if="status !== 'ready'" class="graph-view__state">
      <p v-if="status === 'empty'">No graph entities are available here.</p>
      <p v-else-if="status === 'missing'">The addressed graph entity no longer exists.</p>
      <p v-else-if="status === 'not-found'">No path connects these Blocks.</p>
      <p v-else-if="status === 'limit'">The path exceeds the current exploration boundary.</p>
      <p v-else>Graph retrieval is temporarily unavailable.</p>
      <InkButton
        v-if="status === 'empty' || status === 'missing'"
        text="Recall information"
        theme="subtle"
        @click="openRecallSearch"
      />
    </div>

    <VueFlow
      v-else
      v-model:nodes="nodes"
      v-model:edges="edges"
      class="graph-view__flow"
      :min-zoom="0.18"
      :max-zoom="2.4"
      :nodes-draggable="true"
      @node-drag-stop="onNodeDragStop"
    >
      <template #node-block="nodeProps">
        <BlockNodeComponent v-bind="nodeProps" @focus="focusBlock" @inspect="inspectBlock" />
      </template>
      <template #edge-relation="edgeProps">
        <RelationEdgeComponent
          v-bind="edgeProps"
          @focus="focusRelation"
          @inspect="inspectRelation"
        />
      </template>
      <Background :gap="24" pattern-color="var(--ink-border-subtle, #d9dde3)" />
      <div class="graph-view__viewport-controls">
        <InkButton icon="i-mdi-plus" type="square" theme="subtle" @click="zoomIn" />
        <InkButton icon="i-mdi-minus" type="square" theme="subtle" @click="zoomOut" />
        <InkButton icon="i-mdi-crosshairs-gps" type="square" theme="subtle" @click="refocus" />
      </div>
    </VueFlow>

    <BlockInspectorPopup
      v-if="isRoute(currentRoute, 'block') && currentRoute?.name === 'block'"
      :block="currentRoute.block"
      @ruminated="onRuminated"
    />
    <RelationInspectorPopup
      v-else-if="isRoute(currentRoute, 'relation') && currentRoute?.name === 'relation'"
      :relation="currentRoute.relation"
    />
    <SolvedContentPopup
      v-else-if="isRoute(currentRoute, 'solved-content') && currentRoute?.name === 'solved-content'"
      :block="currentRoute.block"
    />
  </main>
</template>

<style scoped lang="scss" src="./graph.scss" />
