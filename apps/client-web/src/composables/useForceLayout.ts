import { ref, watch, onUnmounted, getCurrentInstance, type Ref } from "vue";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";
import type { Node } from "@vue-flow/core";
import {
  DEFAULT_FORCE_CONFIG,
  type ForceLayoutConfig,
  type SimulationNode,
  type SimulationLink,
} from "@inkcre/core";

interface UseForceLayoutOptions {
  nodes: Ref<Node[]>;
  links: Ref<SimulationLink[]>;
  config?: Partial<ForceLayoutConfig>;
  onPositionUpdate?: (positions: Map<string, { x: number; y: number }>) => void;
}

interface UseForceLayoutReturn {
  isRunning: Ref<boolean>;
  alpha: Ref<number>;
  start: () => void;
  stop: () => void;
  restart: () => void;
  fixNode: (nodeId: string, x: number, y: number) => void;
  unfixNode: (nodeId: string) => void;
}

export function useForceLayout({
  nodes,
  links,
  config = {},
  onPositionUpdate,
}: UseForceLayoutOptions): UseForceLayoutReturn {
  const isRunning = ref(false);
  const alpha = ref(0);

  // Use ReturnType to infer the correct simulation type
  let simulation: ReturnType<typeof forceSimulation<SimulationNode>> | null = null;
  let simulationNodes: SimulationNode[] = [];

  const mergedConfig = { ...DEFAULT_FORCE_CONFIG, ...config };

  function createSimulation(width: number, height: number) {
    // Create simulation nodes from Vue Flow nodes
    simulationNodes = nodes.value.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
    }));

    // Create simulation links
    const simulationLinks = links.value.map((link) => ({
      source: link.source,
      target: link.target,
    }));

    // Track iterations for maxIterations limit
    let iterationCount = 0;

    // Create force simulation
    simulation = forceSimulation<SimulationNode>(simulationNodes)
      .force(
        "link",
        forceLink<SimulationNode, { source: string; target: string }>(simulationLinks)
          .id((d) => d.id)
          .distance(mergedConfig.linkDistance)
      )
      .force("charge", forceManyBody().strength(mergedConfig.chargeForce))
      .force("center", forceCenter(width / 2, height / 2).strength(mergedConfig.centerForce))
      .force(
        "collide",
        forceCollide<SimulationNode>(mergedConfig.collideRadius)
          .strength(mergedConfig.collideStrength)
          .iterations(mergedConfig.collideIterations)
      )
      .alphaDecay(mergedConfig.alphaDecay)
      .on("tick", () => {
        iterationCount++;
        // Stop if maxIterations is set and reached
        if (mergedConfig.maxIterations && iterationCount >= mergedConfig.maxIterations) {
          simulation?.stop();
          onEnd();
          return;
        }
        onTick();
      })
      .on("end", onEnd);

    // Pre-warm the simulation
    const sim = simulation;
    const preWarmTicks = mergedConfig.maxIterations
      ? Math.min(mergedConfig.preWarmTicks, mergedConfig.maxIterations)
      : mergedConfig.preWarmTicks;
    for (let i = 0; i < preWarmTicks; i++) {
      sim.tick();
      iterationCount++;
    }
    // Manually emit positions after pre-warm (tick events don't fire for manual ticks)
    onTick();

    isRunning.value = true;
  }

  function onTick() {
    if (!simulation) return;

    alpha.value = simulation.alpha();

    // Emit position updates via callback
    if (onPositionUpdate) {
      const positions = new Map<string, { x: number; y: number }>();
      for (const simNode of simulationNodes) {
        positions.set(simNode.id, { x: simNode.x!, y: simNode.y! });
      }
      onPositionUpdate(positions);
    }
  }

  function onEnd() {
    isRunning.value = false;
    alpha.value = 0;
  }

  function start() {
    const width = config.width ?? 800;
    const height = config.height ?? 600;
    createSimulation(width, height);
  }

  function stop() {
    if (simulation) {
      simulation.stop();
      isRunning.value = false;
    }
  }

  function restart() {
    if (simulation) {
      simulation.alpha(1).restart();
      isRunning.value = true;
    }
  }

  function fixNode(nodeId: string, x: number, y: number) {
    const simNode = simulationNodes.find((n) => n.id === nodeId);
    if (simNode) {
      simNode.fx = x;
      simNode.fy = y;
    }
  }

  function unfixNode(nodeId: string) {
    const simNode = simulationNodes.find((n) => n.id === nodeId);
    if (simNode) {
      simNode.fx = null;
      simNode.fy = null;
    }
    // Restart simulation when node is released
    if (simulation) {
      simulation.alpha(0.3).restart();
      isRunning.value = true;
    }
  }

  // Watch for changes in nodes/links and reinitialize
  watch(
    [() => nodes.value.length, () => links.value.length],
    () => {
      if (simulation) {
        stop();
        start();
      }
    },
    { flush: "post" }
  );

  // Cleanup on unmount (only if called during component setup)
  if (getCurrentInstance()) {
    onUnmounted(() => {
      stop();
      simulation = null;
    });
  }

  return {
    isRunning,
    alpha,
    start,
    stop,
    restart,
    fixNode,
    unfixNode,
  };
}
