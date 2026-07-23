import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import { type RadialLayoutConfig, type LayoutResult, DEFAULT_RADIAL_CONFIG } from '@inkcre/core'

export interface UseRadialLayoutOptions {
  config?: Partial<RadialLayoutConfig>
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>()

  // Initialize all nodes
  nodes.forEach((node) => {
    adjacency.set(node.id, new Set())
  })

  // Add edges (treat as undirected for radial layout)
  edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  })

  return adjacency
}

/**
 * Find the node with highest degree (most connections)
 */
function findHighestDegreeNode(nodes: Node[], edges: Edge[]): string | undefined {
  if (nodes.length === 0) return undefined

  const degreeMap = new Map<string, number>()

  // Initialize degrees
  nodes.forEach((node) => {
    degreeMap.set(node.id, 0)
  })

  // Count degrees
  edges.forEach((edge) => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1)
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1)
  })

  // Find max
  let maxDegree = -1
  let centerNode: string | undefined

  degreeMap.forEach((degree, nodeId) => {
    if (degree > maxDegree) {
      maxDegree = degree
      centerNode = nodeId
    }
  })

  return centerNode
}

/**
 * BFS to compute levels from center node
 */
function computeLevels(
  centerNodeId: string,
  adjacency: Map<string, Set<string>>
): Map<number, string[]> {
  const levels = new Map<number, string[]>()
  const visited = new Set<string>()
  const queue: Array<{ nodeId: string; level: number }> = []

  // Start from center
  queue.push({ nodeId: centerNodeId, level: 0 })
  visited.add(centerNodeId)

  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!

    // Add to level
    if (!levels.has(level)) {
      levels.set(level, [])
    }
    levels.get(level)!.push(nodeId)

    // Process neighbors
    const neighbors = adjacency.get(nodeId) ?? new Set()
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ nodeId: neighbor, level: level + 1 })
      }
    })
  }

  return levels
}

export function useRadialLayout(options: UseRadialLayoutOptions = {}) {
  const isRunning = ref(false)

  const mergedConfig = {
    ...DEFAULT_RADIAL_CONFIG,
    ...options.config,
  }

  async function apply(nodes: Node[], edges: Edge[]): Promise<LayoutResult> {
    isRunning.value = true

    try {
      const positions = new Map<string, { x: number; y: number }>()

      if (nodes.length === 0) {
        return {
          positions,
          bounds: { width: 0, height: 0 },
        }
      }

      // Find center node
      const centerNodeId = mergedConfig.centerNodeId ?? findHighestDegreeNode(nodes, edges)

      if (!centerNodeId) {
        // Fallback: just use first node
        positions.set(nodes[0].id, { x: 0, y: 0 })
        return {
          positions,
          bounds: { width: 200, height: 200 },
        }
      }

      // Build adjacency and compute levels
      const adjacency = buildAdjacencyList(nodes, edges)
      const levels = computeLevels(centerNodeId, adjacency)

      // Find max radius needed
      const maxLevel = Math.max(...levels.keys())
      const maxRadius = mergedConfig.minRadius + maxLevel * mergedConfig.levelSep
      const centerX = maxRadius + 50
      const centerY = maxRadius + 50

      // Position nodes by level
      levels.forEach((nodeIds, level) => {
        if (level === 0) {
          // Center node
          positions.set(nodeIds[0], { x: centerX, y: centerY })
        } else {
          const radius = mergedConfig.minRadius + level * mergedConfig.levelSep
          const angleStep = (2 * Math.PI) / nodeIds.length

          nodeIds.forEach((nodeId, i) => {
            const angle = i * angleStep - Math.PI / 2 // Start from top
            positions.set(nodeId, {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
            })
          })
        }
      })

      // Handle disconnected nodes (not reached by BFS)
      const positionedNodes = new Set(positions.keys())
      const disconnected = nodes.filter((n) => !positionedNodes.has(n.id))

      if (disconnected.length > 0) {
        // Place disconnected nodes in outer ring
        const outerRadius = maxRadius + mergedConfig.levelSep
        const angleStep = (2 * Math.PI) / disconnected.length

        disconnected.forEach((node, i) => {
          const angle = i * angleStep
          positions.set(node.id, {
            x: centerX + outerRadius * Math.cos(angle),
            y: centerY + outerRadius * Math.sin(angle),
          })
        })
      }

      const totalRadius = maxRadius + mergedConfig.levelSep + 100

      return {
        positions,
        bounds: {
          width: totalRadius * 2,
          height: totalRadius * 2,
        },
      }
    } finally {
      isRunning.value = false
    }
  }

  function stop() {
    isRunning.value = false
  }

  return {
    isRunning,
    apply,
    stop,
  }
}
