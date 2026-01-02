import type { Ref } from "vue";
import type { Node, Edge } from "@vue-flow/core";

/**
 * Available layout algorithms
 */
export enum LayoutType {
  Force = "force",
  Dagre = "dagre",
  Circular = "circular",
  Radial = "radial",
  Grid = "grid",
  Auto = "auto",
}

/**
 * Layout direction for hierarchical layouts (Dagre)
 */
export enum LayoutDirection {
  TopToBottom = "TB",
  BottomToTop = "BT",
  LeftToRight = "LR",
  RightToLeft = "RL",
}

/**
 * Common layout configuration interface
 */
export interface BaseLayoutConfig {
  width?: number;
  height?: number;
  padding?: number;
}

/**
 * Dagre-specific configuration
 */
export interface DagreLayoutConfig extends BaseLayoutConfig {
  direction?: LayoutDirection;
  nodeSep?: number;
  rankSep?: number;
  edgeSep?: number;
  align?: "UL" | "UR" | "DL" | "DR";
  ranker?: "network-simplex" | "tight-tree" | "longest-path";
}

/**
 * Circular layout configuration
 */
export interface CircularLayoutConfig extends BaseLayoutConfig {
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  clockwise?: boolean;
}

/**
 * Radial layout configuration
 */
export interface RadialLayoutConfig extends BaseLayoutConfig {
  centerNodeId?: string;
  levelSep?: number;
  minRadius?: number;
}

/**
 * Grid layout configuration
 */
export interface GridLayoutConfig extends BaseLayoutConfig {
  columns?: number;
  cellWidth?: number;
  cellHeight?: number;
  gap?: number;
}

/**
 * Extended force layout configuration with iteration limit
 */
export interface ExtendedForceLayoutConfig extends BaseLayoutConfig {
  centerForce?: number;
  chargeForce?: number;
  linkDistance?: number;
  collideRadius?: number;
  collideStrength?: number;
  collideIterations?: number;
  alphaDecay?: number;
  preWarmTicks?: number;
  maxIterations?: number;
}

/**
 * Union type for all layout configs
 */
export type LayoutConfig =
  | DagreLayoutConfig
  | CircularLayoutConfig
  | RadialLayoutConfig
  | GridLayoutConfig
  | ExtendedForceLayoutConfig;

/**
 * Layout result with computed positions
 */
export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  bounds: { width: number; height: number };
  edgePoints?: Map<string, Array<{ x: number; y: number }>>;
}

/**
 * Layout composable interface (common contract)
 */
export interface LayoutComposable {
  isRunning: Ref<boolean>;
  apply: (nodes: Node[], edges: Edge[]) => Promise<LayoutResult>;
  stop: () => void;
}

/**
 * Layout selection state for UI
 */
export interface LayoutSelection {
  type: LayoutType;
  isAutoDetected: boolean;
  detectedTopology?: string;
}

/**
 * Default configurations for each layout type
 */
export const DEFAULT_DAGRE_CONFIG: Required<Omit<DagreLayoutConfig, keyof BaseLayoutConfig>> = {
  direction: LayoutDirection.TopToBottom,
  nodeSep: 100, // Increased to prevent edge-node overlap (nodes are up to 200px wide)
  rankSep: 120, // Increased to give more vertical space for edge routing
  edgeSep: 20, // Increased to give more space between edges
  align: "UL",
  ranker: "network-simplex",
};

export const DEFAULT_CIRCULAR_CONFIG: Required<Omit<CircularLayoutConfig, keyof BaseLayoutConfig>> = {
  radius: 300, // Increased for better edge-node separation
  startAngle: 0,
  endAngle: 2 * Math.PI,
  clockwise: true,
};

export const DEFAULT_RADIAL_CONFIG: Required<Omit<RadialLayoutConfig, keyof BaseLayoutConfig | "centerNodeId">> = {
  levelSep: 200, // Increased for better edge-node separation
  minRadius: 150, // Increased to account for node size
};

export const DEFAULT_GRID_CONFIG: Required<Omit<GridLayoutConfig, keyof BaseLayoutConfig>> = {
  columns: 0, // 0 means auto-calculate
  cellWidth: 250,
  cellHeight: 150,
  gap: 40,
};
