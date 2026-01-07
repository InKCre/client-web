import { type Node, type Edge, MarkerType } from '@vue-flow/core'
import type { Block } from '../../info-base/block'
import type { Relation } from '../../info-base/relation'

/**
 * Custom node data for block visualization
 */
export interface BlockNodeData {
  block: Block
  preview: string
  relations: Relation[]
}

/**
 * Custom edge data for relation visualization
 */
export interface RelationEdgeData {
  relation: Relation
}

/**
 * Vue Flow node with block data
 */
export type BlockNode = Node<BlockNodeData, any, 'block'>

/**
 * Vue Flow edge with relation data
 */
export type RelationEdge = Edge<RelationEdgeData>

/**
 * Force simulation node (extends Vue Flow node with simulation properties)
 */
export interface SimulationNode {
  id: string
  x: number
  y: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

/**
 * Force simulation link
 */
export interface SimulationLink {
  source: string
  target: string
}

/**
 * Force layout configuration
 */
export interface ForceLayoutConfig {
  width: number
  height: number
  centerForce?: number
  chargeForce?: number
  linkDistance?: number
  collideRadius?: number
  collideStrength?: number
  collideIterations?: number
  alphaDecay?: number
  preWarmTicks?: number
  maxIterations?: number
}

/**
 * Default force layout configuration
 */
export const DEFAULT_FORCE_CONFIG: Required<Omit<ForceLayoutConfig, 'width' | 'height'>> = {
  centerForce: 0.3,
  chargeForce: -800, // Increased repulsion to push nodes further apart
  linkDistance: 250, // Increased to give more room for edge routing
  collideRadius: 150, // Increased to account for node size (max 200x150)
  collideStrength: 1.0,
  collideIterations: 10,
  alphaDecay: 0.02,
  preWarmTicks: 300,
  maxIterations: 0, // 0 means no limit
}

/**
 * Transform Block to Vue Flow node
 */
export function blockToNode(
  block: Block,
  preview: string,
  relations: Relation[],
  position?: { x: number; y: number }
): BlockNode {
  return {
    id: String(block.id),
    type: 'block',
    position: position ?? { x: Math.random() * 500, y: Math.random() * 500 },
    draggable: true,
    data: {
      block,
      preview,
      relations,
    },
  }
}

/**
 * Transform Relation to Vue Flow edge
 */
export function relationToEdge(relation: Relation): RelationEdge {
  return {
    id: String(relation.id),
    type: 'relation',
    source: String(relation.from_),
    target: String(relation.to_),
    data: {
      relation,
    },
    markerEnd: MarkerType.ArrowClosed,
  }
}
