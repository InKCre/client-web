import { ref } from "vue";
import type { Node, Edge } from "@vue-flow/core";
import {
  type CircularLayoutConfig,
  type LayoutResult,
  DEFAULT_CIRCULAR_CONFIG,
} from "@/business/info-base/graph/layout-types";

export interface UseCircularLayoutOptions {
  config?: Partial<CircularLayoutConfig>;
}

export function useCircularLayout(options: UseCircularLayoutOptions = {}) {
  const isRunning = ref(false);

  const mergedConfig = {
    ...DEFAULT_CIRCULAR_CONFIG,
    ...options.config,
  };

  async function apply(nodes: Node[], _edges: Edge[]): Promise<LayoutResult> {
    isRunning.value = true;

    try {
      const positions = new Map<string, { x: number; y: number }>();
      const n = nodes.length;

      if (n === 0) {
        return {
          positions,
          bounds: { width: 0, height: 0 },
        };
      }

      if (n === 1) {
        positions.set(nodes[0].id, { x: 0, y: 0 });
        return {
          positions,
          bounds: { width: 200, height: 200 },
        };
      }

      // Calculate radius based on number of nodes if not specified
      const radius = mergedConfig.radius > 0
        ? mergedConfig.radius
        : Math.max(100, n * 30);

      const centerX = radius;
      const centerY = radius;
      const startAngle = mergedConfig.startAngle;
      const endAngle = mergedConfig.endAngle;
      const angleRange = endAngle - startAngle;
      const angleStep = angleRange / n;
      const direction = mergedConfig.clockwise ? 1 : -1;

      nodes.forEach((node, i) => {
        const angle = startAngle + direction * i * angleStep;
        positions.set(node.id, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });

      const diameter = radius * 2;
      return {
        positions,
        bounds: {
          width: diameter + 100,
          height: diameter + 100,
        },
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
