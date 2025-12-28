import { ref } from "vue";
import dagre from "dagre";
import type { Node, Edge } from "@vue-flow/core";
import {
  type DagreLayoutConfig,
  type LayoutResult,
  DEFAULT_DAGRE_CONFIG,
  LayoutDirection,
} from "@/business/info-base/graph/layout-types";

const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 80;

export interface UseDagreLayoutOptions {
  config?: Partial<DagreLayoutConfig>;
}

export function useDagreLayout(options: UseDagreLayoutOptions = {}) {
  const isRunning = ref(false);

  const mergedConfig = {
    ...DEFAULT_DAGRE_CONFIG,
    ...options.config,
  };

  async function apply(nodes: Node[], edges: Edge[]): Promise<LayoutResult> {
    isRunning.value = true;

    try {
      const g = new dagre.graphlib.Graph();

      g.setGraph({
        rankdir: mergedConfig.direction ?? LayoutDirection.TopToBottom,
        nodesep: mergedConfig.nodeSep,
        ranksep: mergedConfig.rankSep,
        edgesep: mergedConfig.edgeSep,
        align: mergedConfig.align,
        ranker: mergedConfig.ranker,
      });

      g.setDefaultEdgeLabel(() => ({}));

      // Add nodes with dimensions
      nodes.forEach((node) => {
        const nodeAny = node as any;
        g.setNode(node.id, {
          width: nodeAny.measured?.width ?? nodeAny.width ?? DEFAULT_NODE_WIDTH,
          height: nodeAny.measured?.height ?? nodeAny.height ?? DEFAULT_NODE_HEIGHT,
        });
      });

      // Add edges
      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      // Run layout
      dagre.layout(g);

      // Extract positions
      const positions = new Map<string, { x: number; y: number }>();
      g.nodes().forEach((nodeId) => {
        const node = g.node(nodeId);
        if (node) {
          // Dagre returns center position, adjust to top-left for Vue Flow
          positions.set(nodeId, {
            x: node.x - (node.width ?? DEFAULT_NODE_WIDTH) / 2,
            y: node.y - (node.height ?? DEFAULT_NODE_HEIGHT) / 2,
          });
        }
      });

      // Extract edge points if available
      const edgePoints = new Map<string, Array<{ x: number; y: number }>>();
      g.edges().forEach((e) => {
        const edge = g.edge(e);
        if (edge?.points) {
          const edgeId = edges.find(
            (ed) => ed.source === e.v && ed.target === e.w
          )?.id;
          if (edgeId) {
            edgePoints.set(edgeId, edge.points);
          }
        }
      });

      const graphInfo = g.graph();

      return {
        positions,
        bounds: {
          width: graphInfo.width ?? 800,
          height: graphInfo.height ?? 600,
        },
        edgePoints,
      };
    } finally {
      isRunning.value = false;
    }
  }

  function stop() {
    isRunning.value = false;
  }

  return {
    isRunning,
    apply,
    stop,
  };
}
