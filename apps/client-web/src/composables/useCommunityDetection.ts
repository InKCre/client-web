import { ref, watch, type Ref } from 'vue'
import Graph from 'graphology'
import louvain from 'graphology-communities-louvain'
import type { BlockNode } from '@inkcre/core'
import type { Edge } from '@vue-flow/core'
import type { CommunityMetadata, CommunityMap } from '@inkcre/core'

export interface UseCommunityDetectionOptions {
  nodes: Ref<BlockNode[]>
  edges: Ref<Edge[]>
  enabled?: Ref<boolean>
}

export interface UseCommunityDetectionReturn {
  communities: Ref<CommunityMap>
  communityMetadata: Ref<CommunityMetadata[]>
  isDetecting: Ref<boolean>
  getCommunityNodes: (communityId: string) => string[]
  recompute: () => void
}

/**
 * Community detection composable using Louvain algorithm
 * Detects communities in a graph and provides metadata for navigation
 */
export function useCommunityDetection({
  nodes,
  edges,
  enabled = ref(true),
}: UseCommunityDetectionOptions): UseCommunityDetectionReturn {
  const communities = ref<CommunityMap>(new Map())
  const communityMetadata = ref<CommunityMetadata[]>([])
  const isDetecting = ref(false)

  /**
   * Run community detection using Louvain algorithm
   */
  function detectCommunities() {
    if (!enabled.value || nodes.value.length === 0) {
      communities.value = new Map()
      communityMetadata.value = []
      return
    }

    isDetecting.value = true

    try {
      // Create graphology graph (undirected for community detection)
      const graph = new Graph({ type: 'undirected' })

      // Add nodes
      nodes.value.forEach((node) => {
        graph.addNode(node.id)
      })

      // Add edges (avoid duplicates)
      edges.value.forEach((edge) => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          if (!graph.hasEdge(edge.source, edge.target)) {
            graph.addEdge(edge.source, edge.target)
          }
        }
      })

      // Run Louvain algorithm
      // Returns: { [nodeId]: communityId }
      const nodeCommunities = louvain(graph)

      // Transform to our format: Map<communityId, Set<nodeId>>
      const communityMap = new Map<string, Set<string>>()

      Object.entries(nodeCommunities).forEach(([nodeId, communityId]) => {
        const commId = String(communityId)
        if (!communityMap.has(commId)) {
          communityMap.set(commId, new Set())
        }
        communityMap.get(commId)!.add(nodeId)
      })

      // Create metadata sorted by size (largest first)
      const metadata: CommunityMetadata[] = Array.from(communityMap.entries())
        .map(([id, nodeIds], index) => ({
          id,
          label: `Community ${index + 1}`,
          nodeCount: nodeIds.size,
        }))
        .sort((a, b) => b.nodeCount - a.nodeCount)

      communities.value = communityMap
      communityMetadata.value = metadata
    } catch (error) {
      console.error('Failed to detect communities:', error)
      communities.value = new Map()
      communityMetadata.value = []
    } finally {
      isDetecting.value = false
    }
  }

  /**
   * Get all node IDs in a specific community
   */
  function getCommunityNodes(communityId: string): string[] {
    return Array.from(communities.value.get(communityId) ?? [])
  }

  /**
   * Manually trigger recomputation
   */
  function recompute() {
    detectCommunities()
  }

  // Watch for structural changes (node/edge count changes)
  watch(
    [() => nodes.value.length, () => edges.value.length, enabled],
    () => {
      if (enabled.value) {
        detectCommunities()
      }
    },
    { immediate: true }
  )

  return {
    communities,
    communityMetadata,
    isDetecting,
    getCommunityNodes,
    recompute,
  }
}
