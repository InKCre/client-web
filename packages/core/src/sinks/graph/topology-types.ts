import { LayoutType } from "./layout-types";

/**
 * Detected graph topology types
 */
export enum TopologyType {
  Tree = "tree",
  DAG = "dag",
  Star = "star",
  Linear = "linear",
  Cyclic = "cyclic",
  Disconnected = "disconnected",
  Unknown = "unknown",
}

/**
 * Graph metrics for topology detection
 */
export interface TopologyMetrics {
  nodeCount: number;
  edgeCount: number;
  hasCycles: boolean;
  isConnected: boolean;
  maxInDegree: number;
  maxOutDegree: number;
  avgDegree: number;
  hasStarCenter: boolean;
  starCenterNodeId?: string;
  rootNodes: string[];
  leafNodes: string[];
  depth?: number;
}

/**
 * Topology detection result
 */
export interface TopologyAnalysis {
  type: TopologyType;
  confidence: number;
  metrics: TopologyMetrics;
  suggestedLayout: LayoutType;
}

/**
 * Map topology type to suggested layout type
 */
export function topologyToLayout(type: TopologyType): LayoutType {
  switch (type) {
    case TopologyType.Tree:
    case TopologyType.DAG:
      return LayoutType.Dagre;
    case TopologyType.Star:
      return LayoutType.Radial;
    case TopologyType.Linear:
      return LayoutType.Dagre;
    default:
      return LayoutType.Force;
  }
}
