import { ref, type Ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { CommunityMap } from '@inkcre/core'
import { classicalMDS } from '@inkcre/core'
import { computeIntraCommunityDistances, computeInterCommunityDistances } from '@inkcre/core'

interface CommunityBounds {
  communityId: string
  x: number
  y: number
  width: number
  height: number
  nodePositions: Map<string, { x: number; y: number }>
}

export interface UseAllCommunitiesLayoutOptions {
  nodes: Ref<Node[]>
  edges: Ref<Edge[]>
  communities: Ref<CommunityMap>
  onPositionUpdate: (positions: Map<string, { x: number; y: number }>) => void
}

const COMMUNITY_PADDING = 80 // Increased for better edge-node separation
const COMMUNITY_GAP = 180 // Increased to prevent edge overlap between communities
const NODE_WIDTH = 200
const NODE_HEIGHT = 150
const INTRA_COMMUNITY_BASE_SIZE = 500 // Increased for better spacing within communities
const LAYOUT_TARGET_SIZE = 2000 // Increased for overall layout breathing room

export function useAllCommunitiesLayout(options: UseAllCommunitiesLayoutOptions) {
  const { nodes, edges, communities, onPositionUpdate } = options
  const isRunning = ref(false)

  /**
   * Layout nodes within a single community using MDS
   * Positions are based on shortest path distances between nodes
   */
  function layoutCommunityMDS(
    communityNodes: Node[],
    communityEdges: Edge[]
  ): {
    positions: Map<string, { x: number; y: number }>
    bounds: { width: number; height: number }
  } {
    const positions = new Map<string, { x: number; y: number }>()
    const n = communityNodes.length

    if (n === 0) {
      return { positions, bounds: { width: 0, height: 0 } }
    }

    if (n === 1) {
      positions.set(communityNodes[0].id, {
        x: COMMUNITY_PADDING,
        y: COMMUNITY_PADDING,
      })
      return {
        positions,
        bounds: {
          width: NODE_WIDTH + COMMUNITY_PADDING * 2,
          height: NODE_HEIGHT + COMMUNITY_PADDING * 2,
        },
      }
    }

    // Compute distance matrix based on graph connectivity (shortest paths)
    const nodeIds = communityNodes.map((n) => n.id)
    const distances = computeIntraCommunityDistances(nodeIds, communityEdges)

    // Run classical MDS to get 2D coordinates
    const mdsResult = classicalMDS(distances, 2)
    const coords = mdsResult.coordinates

    // Find bounds of MDS output
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const [x, y] of coords) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Scale based on community size - larger communities get more space
    const targetSize = Math.sqrt(n) * 200 + INTRA_COMMUNITY_BASE_SIZE
    const scale = Math.min(
      (targetSize - 2 * COMMUNITY_PADDING) / rangeX,
      (targetSize - 2 * COMMUNITY_PADDING) / rangeY
    )

    // Map MDS coordinates to screen coordinates
    for (let i = 0; i < n; i++) {
      positions.set(nodeIds[i], {
        x: (coords[i][0] - minX) * scale + COMMUNITY_PADDING,
        y: (coords[i][1] - minY) * scale + COMMUNITY_PADDING,
      })
    }

    return {
      positions,
      bounds: {
        width: rangeX * scale + NODE_WIDTH + COMMUNITY_PADDING * 2,
        height: rangeY * scale + NODE_HEIGHT + COMMUNITY_PADDING * 2,
      },
    }
  }

  /**
   * Position communities relative to each other using MDS
   * Communities with more inter-community edges are placed closer together
   */
  function positionCommunitiesMDS(communityBoundsList: CommunityBounds[], allEdges: Edge[]): void {
    const n = communityBoundsList.length

    if (n <= 1) {
      if (n === 1) {
        communityBoundsList[0].x = 0
        communityBoundsList[0].y = 0
      }
      return
    }

    // Build community map for distance calculation
    const communityMap: CommunityMap = new Map()
    for (const cb of communityBoundsList) {
      const nodeIds = new Set<string>()
      cb.nodePositions.forEach((_, nodeId) => nodeIds.add(nodeId))
      communityMap.set(cb.communityId, nodeIds)
    }

    // Compute inter-community distances based on edge count
    const { distances, communityIds } = computeInterCommunityDistances(communityMap, allEdges)

    // Run MDS to get community positions
    const mdsResult = classicalMDS(distances, 2)
    const coords = mdsResult.coordinates

    // Map community IDs to their bounds index
    const idToIndex = new Map(communityIds.map((id, i) => [id, i]))

    // Find bounds of MDS output
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const [x, y] of coords) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }

    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1

    // Estimate total area needed based on community sizes
    const totalArea = communityBoundsList.reduce((sum, cb) => sum + cb.width * cb.height, 0)
    const targetSize = Math.max(LAYOUT_TARGET_SIZE, Math.sqrt(totalArea) * 1.5)

    const scale = Math.min(targetSize / rangeX, targetSize / rangeY)

    // Position each community based on MDS coordinates
    for (const cb of communityBoundsList) {
      const idx = idToIndex.get(cb.communityId)
      if (idx !== undefined) {
        cb.x = (coords[idx][0] - minX) * scale
        cb.y = (coords[idx][1] - minY) * scale
      }
    }

    // Resolve any overlaps between communities
    resolveOverlaps(communityBoundsList)
  }

  /**
   * Resolve overlapping communities by pushing them apart
   * Uses simple iterative repulsion
   */
  function resolveOverlaps(communityBoundsList: CommunityBounds[]): void {
    const iterations = 50
    const pushStrength = 0.5

    for (let iter = 0; iter < iterations; iter++) {
      let hasOverlap = false

      for (let i = 0; i < communityBoundsList.length; i++) {
        for (let j = i + 1; j < communityBoundsList.length; j++) {
          const a = communityBoundsList[i]
          const b = communityBoundsList[j]

          // Check overlap with gap consideration
          const overlapX =
            a.x + a.width + COMMUNITY_GAP > b.x && b.x + b.width + COMMUNITY_GAP > a.x
          const overlapY =
            a.y + a.height + COMMUNITY_GAP > b.y && b.y + b.height + COMMUNITY_GAP > a.y

          if (overlapX && overlapY) {
            hasOverlap = true

            // Calculate centers
            const aCenterX = a.x + a.width / 2
            const aCenterY = a.y + a.height / 2
            const bCenterX = b.x + b.width / 2
            const bCenterY = b.y + b.height / 2

            // Push communities apart
            const dx = bCenterX - aCenterX
            const dy = bCenterY - aCenterY
            const dist = Math.sqrt(dx * dx + dy * dy) || 1

            const pushX = (dx / dist) * pushStrength * COMMUNITY_GAP
            const pushY = (dy / dist) * pushStrength * COMMUNITY_GAP

            a.x -= pushX
            a.y -= pushY
            b.x += pushX
            b.y += pushY
          }
        }
      }

      // Stop early if no overlaps remain
      if (!hasOverlap) break
    }
  }

  /**
   * Apply MDS-based layout to all communities
   *
   * Algorithm:
   * 1. For each community: compute internal layout using MDS (based on shortest paths)
   * 2. Position communities relative to each other using MDS (based on inter-community edges)
   * 3. Resolve any overlaps
   * 4. Combine all positions
   */
  async function applyLayout(): Promise<void> {
    if (nodes.value.length === 0 || communities.value.size === 0) {
      return
    }

    isRunning.value = true

    try {
      const communityBoundsList: CommunityBounds[] = []
      const communityEntries = Array.from(communities.value.entries())

      // Step 1: Layout each community internally using MDS
      for (const [communityId, nodeIds] of communityEntries) {
        const communityNodes = nodes.value.filter((n) => nodeIds.has(n.id))
        const communityEdges = edges.value.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        )

        const result = layoutCommunityMDS(communityNodes, communityEdges)

        communityBoundsList.push({
          communityId,
          x: 0,
          y: 0,
          width: result.bounds.width,
          height: result.bounds.height,
          nodePositions: result.positions,
        })
      }

      // Step 2: Position communities using MDS based on inter-community edges
      positionCommunitiesMDS(communityBoundsList, edges.value)

      // Step 3: Combine all positions with community offsets
      const allPositions = new Map<string, { x: number; y: number }>()

      communityBoundsList.forEach((cb) => {
        cb.nodePositions.forEach((localPos, nodeId) => {
          allPositions.set(nodeId, {
            x: cb.x + localPos.x,
            y: cb.y + localPos.y,
          })
        })
      })

      onPositionUpdate(allPositions)
    } finally {
      isRunning.value = false
    }
  }

  function stop() {
    isRunning.value = false
  }

  return {
    isRunning,
    applyLayout,
    stop,
  }
}
