import { ref, computed, type Ref } from "vue";
import type { Node, Edge } from "@vue-flow/core";
import {
  LayoutType,
  type LayoutResult,
  type LayoutSelection,
} from "@inkcre/core";
import { TopologyType } from "@inkcre/core";
import type { SimulationLink } from "@inkcre/core";
import { useTopologyDetection } from "./useTopologyDetection";
import { useDagreLayout } from "./layouts/useDagreLayout";
import { useCircularLayout } from "./layouts/useCircularLayout";
import { useRadialLayout } from "./layouts/useRadialLayout";
import { useGridLayout } from "./layouts/useGridLayout";
import { useForceLayout } from "./useForceLayout";

export interface UseLayoutManagerOptions {
  nodes: Ref<Node[]>;
  edges: Ref<Edge[]>;
  links: Ref<SimulationLink[]>;
  width?: number;
  height?: number;
  onPositionUpdate: (positions: Map<string, { x: number; y: number }>) => void;
}

export interface UseLayoutManagerReturn {
  currentLayout: Ref<LayoutType>;
  effectiveLayout: Ref<LayoutType>;
  isAutoMode: Ref<boolean>;
  detectedTopology: Ref<TopologyType | null>;
  isRunning: Ref<boolean>;
  layoutSelection: Ref<LayoutSelection>;
  applyLayout: () => Promise<void>;
  setLayout: (type: LayoutType) => void;
  forceLayout: ReturnType<typeof useForceLayout>;
}

export function useLayoutManager(
  options: UseLayoutManagerOptions
): UseLayoutManagerReturn {
  const { nodes, edges, links, onPositionUpdate } = options;
  const width = options.width ?? 800;
  const height = options.height ?? 600;

  // State
  const currentLayout = ref<LayoutType>(LayoutType.Auto);
  const isAutoMode = ref(true);
  const detectedTopology = ref<TopologyType | null>(null);
  const isRunning = ref(false);

  // Composables
  const topology = useTopologyDetection();

  const dagreLayout = useDagreLayout();
  const circularLayout = useCircularLayout();
  const radialLayout = useRadialLayout();
  const gridLayout = useGridLayout();

  // Force layout with reactive options for drag support
  const forceLayout = useForceLayout({
    nodes,
    links,
    config: { width, height },
    onPositionUpdate,
  });

  // Get effective layout type (auto-detect or manual)
  const effectiveLayout = computed(() => {
    if (!isAutoMode.value) {
      return currentLayout.value;
    }

    // Auto-detect based on topology
    const analysis = topology.analyze(nodes.value, edges.value);
    detectedTopology.value = analysis.type;
    return analysis.suggestedLayout;
  });

  // Apply layout based on effective layout type
  async function applyLayout(): Promise<void> {
    if (nodes.value.length === 0) return;

    isRunning.value = true;

    try {
      const layoutType = effectiveLayout.value;
      let result: LayoutResult;

      switch (layoutType) {
        case LayoutType.Dagre:
          result = await dagreLayout.apply(nodes.value, edges.value);
          onPositionUpdate(result.positions);
          break;

        case LayoutType.Circular:
          result = await circularLayout.apply(nodes.value, edges.value);
          onPositionUpdate(result.positions);
          break;

        case LayoutType.Radial: {
          // For radial, try to use star center if detected
          const analysis = topology.analyze(nodes.value, edges.value);
          const radialLayoutWithCenter = useRadialLayout({
            config: {
              centerNodeId: analysis.metrics.starCenterNodeId,
            },
          });
          result = await radialLayoutWithCenter.apply(nodes.value, edges.value);
          onPositionUpdate(result.positions);
          break;
        }

        case LayoutType.Grid:
          result = await gridLayout.apply(nodes.value, edges.value);
          onPositionUpdate(result.positions);
          break;

        case LayoutType.Force:
        default:
          // Force layout handles its own position updates
          forceLayout.start();
          return;
      }
    } finally {
      isRunning.value = false;
    }
  }

  // Manual layout selection
  function setLayout(type: LayoutType): void {
    // Stop any running force simulation
    forceLayout.stop();

    isAutoMode.value = type === LayoutType.Auto;
    currentLayout.value = type;

    // Re-detect topology if switching back to auto
    if (type === LayoutType.Auto) {
      const analysis = topology.analyze(nodes.value, edges.value);
      detectedTopology.value = analysis.type;
    }

    applyLayout();
  }

  // Layout selection state for UI
  const layoutSelection = computed<LayoutSelection>(() => ({
    type: effectiveLayout.value,
    isAutoDetected: isAutoMode.value,
    detectedTopology: detectedTopology.value ?? undefined,
  }));

  return {
    currentLayout,
    effectiveLayout,
    isAutoMode,
    detectedTopology,
    isRunning,
    layoutSelection,
    applyLayout,
    setLayout,
    forceLayout,
  };
}
