/**
 * Type definitions for graph view
 */

import type { Block } from "@/business/info-base/block";
import type { Relation } from "@/business/info-base/relation";
import type { NodePosition } from "@/utils/graph/graph-types";

/**
 * State management for the graph view
 */
export interface GraphState {
  // Data
  blocks: Block[];
  relations: Relation[];
  nodePositions: Map<number, NodePosition>;

  // View state
  zoom: number;
  panX: number;
  panY: number;

  // Selection
  selectedBlockId: number | null;

  // Layout
  layoutRunning: boolean;
}
