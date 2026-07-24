/**
 * Community detection types for graph visualization
 */

/**
 * Community structure containing ID and member node IDs
 */
export interface Community {
  id: string
  nodeIds: Set<string>
}

/**
 * Community metadata for UI display
 */
export interface CommunityMetadata {
  id: string
  label: string
  nodeCount: number
}

/**
 * Map of community IDs to sets of node IDs
 */
export type CommunityMap = Map<string, Set<string>>
