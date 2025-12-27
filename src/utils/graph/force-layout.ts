/**
 * Force-directed layout composable using d3-force
 */

import { ref, onUnmounted, type Ref } from "vue";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { Block } from "@/business/info-base/block";
import type { Relation } from "@/business/info-base/relation";
import type { NodePosition } from "./graph-types";

/**
 * Force node extends NodePosition with d3 simulation properties
 */
export interface ForceNode extends NodePosition, SimulationNodeDatum {
  id: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null; // Fixed x position
  fy?: number | null; // Fixed y position
}

/**
 * Force link for connecting nodes
 */
export interface ForceLink extends SimulationLinkDatum<ForceNode> {
  source: number | ForceNode;
  target: number | ForceNode;
}

/**
 * Options for force layout configuration
 */
export interface ForceLayoutOptions {
  width: number;
  height: number;
  centerForce?: number;
  chargeForce?: number;
  linkDistance?: number;
  collideRadius?: number;
  collideStrength?: number;
  collideIterations?: number;
  alphaDecay?: number;
  /** Number of pre-warm ticks to run before first render (default: 300) */
  preWarmTicks?: number;
}

/**
 * Composable for force-directed graph layout
 *
 * @param blocks - Array of blocks to layout as nodes
 * @param relations - Array of relations to layout as edges
 * @param options - Layout configuration options
 * @returns Object with nodes ref and control methods
 */
export function useForceLayout(
  blocks: Ref<Block[]>,
  relations: Ref<Relation[]>,
  options: ForceLayoutOptions
) {
  const nodes = ref<ForceNode[]>([]);
  let simulation: Simulation<ForceNode, ForceLink> | null = null;

  /**
   * Initialize the force-directed layout
   */
  const initLayout = () => {
    // Clean up existing simulation
    if (simulation) {
      simulation.stop();
    }

    // Return early if no blocks
    if (!blocks.value || blocks.value.length === 0) {
      nodes.value = [];
      return;
    }

    // Initialize nodes with random positions within the canvas
    const forceNodes: ForceNode[] = blocks.value.map((block) => ({
      id: block.id,
      x: Math.random() * options.width,
      y: Math.random() * options.height,
    }));

    // Create node map for quick lookup
    const nodeMap = new Map<number, ForceNode>();
    forceNodes.forEach((node) => nodeMap.set(node.id, node));

    // Create links from relations
    const links: ForceLink[] = relations.value
      .filter((rel) => {
        const sourceNode = nodeMap.get(rel.from_);
        const targetNode = nodeMap.get(rel.to_);
        return sourceNode && targetNode;
      })
      .map((rel) => ({
        source: rel.from_,
        target: rel.to_,
      }));

    // Create simulation
    simulation = forceSimulation(forceNodes)
      .force(
        "link",
        forceLink<ForceNode, ForceLink>(links)
          .id((d) => d.id)
          .distance(options.linkDistance || 100)
      )
      .force(
        "charge",
        forceManyBody<ForceNode>().strength(options.chargeForce || -300)
      )
      .force(
        "center",
        forceCenter<ForceNode>(options.width / 2, options.height / 2).strength(
          options.centerForce || 1
        )
      )
      .force(
        "collide",
        forceCollide<ForceNode>()
          .radius(options.collideRadius || 50)
          .strength(options.collideStrength ?? 1.0) // Max strength for hard collision
          .iterations(options.collideIterations ?? 4) // More iterations for dense graphs
      )
      .alphaDecay(options.alphaDecay || 0.02);

    // Pre-warm: Run simulation in background before rendering
    // This ensures the first frame shows non-overlapping nodes
    const preWarmTicks = options.preWarmTicks ?? 300;
    simulation.stop(); // Pause auto-ticking
    for (let i = 0; i < preWarmTicks; i++) {
      simulation.tick();
    }

    // Initial assignment after pre-warming
    nodes.value = [...forceNodes];

    // Now start the simulation for interactive updates
    simulation.alpha(0.3).restart();

    // Update nodes ref on each tick
    simulation.on("tick", () => {
      nodes.value = [...forceNodes];
    });

    // Stop simulation when stable
    simulation.on("end", () => {
      console.log("Force layout simulation completed");
    });
  };

  /**
   * Stop the force simulation
   */
  const stopLayout = () => {
    if (simulation) {
      simulation.stop();
      simulation = null;
    }
  };

  /**
   * Restart the force simulation
   */
  const restartLayout = () => {
    if (simulation) {
      simulation.alpha(1).restart();
    } else {
      initLayout();
    }
  };

  /**
   * Update a node's position and fix it (prevent force movement)
   * @param nodeId - ID of the node to update
   * @param x - New x position
   * @param y - New y position
   */
  const fixNodePosition = (nodeId: number, x: number, y: number) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      if (simulation) {
        simulation.alpha(0.3).restart();
      }
    }
  };

  /**
   * Unfix a node's position (allow force movement)
   * @param nodeId - ID of the node to unfix
   */
  const unfixNodePosition = (nodeId: number) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
      if (simulation) {
        simulation.alpha(0.3).restart();
      }
    }
  };

  /**
   * Get current simulation alpha (energy level)
   * @returns Current alpha value, or 0 if no simulation
   */
  const getAlpha = (): number => {
    return simulation ? simulation.alpha() : 0;
  };

  // Clean up on unmount
  onUnmounted(() => {
    stopLayout();
  });

  return {
    nodes,
    initLayout,
    stopLayout,
    restartLayout,
    fixNodePosition,
    unfixNodePosition,
    getAlpha,
  };
}
