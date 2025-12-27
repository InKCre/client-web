/**
 * Type definitions for graph visualization
 */

import type { Block } from "@/business/info-base/block";
import type { Relation } from "@/business/info-base/relation";

/**
 * Position of a node in 2D space
 */
export interface NodePosition {
  id: number;
  x: number;
  y: number;
  vx?: number; // Velocity X (used by force simulation)
  vy?: number; // Velocity Y (used by force simulation)
}

/**
 * Graph node combining block data with position
 */
export interface GraphNode {
  id: number;
  block: Block;
  position: NodePosition;
}

/**
 * Graph edge combining relation data with endpoint positions
 */
export interface GraphEdge {
  id: number;
  relation: Relation;
  from: NodePosition;
  to: NodePosition;
}

/**
 * Viewport bounds for culling (performance optimization)
 */
export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Configuration for graph rendering
 */
export interface GraphConfig {
  nodeRadius: number;
  edgeStrokeWidth: number;
  nodeStrokeWidth: number;
  selectedNodeStrokeWidth: number;
  zoomMin: number;
  zoomMax: number;
  zoomStep: number;
}

/**
 * Default graph configuration
 */
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  nodeRadius: 60,
  edgeStrokeWidth: 2,
  nodeStrokeWidth: 1,
  selectedNodeStrokeWidth: 3,
  zoomMin: 0.1,
  zoomMax: 5,
  zoomStep: 1.05,
};

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}
