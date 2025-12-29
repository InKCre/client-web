import { ref, type Ref } from "vue";
import type { Node, Edge } from "@vue-flow/core";
import type { CommunityMap } from "@/business/info-base/graph/community-types";
import type { SimulationLink } from "@/business/info-base/graph/graph-types";
import { useGridLayout } from "./layouts/useGridLayout";
import { useForceLayout } from "./useForceLayout";

interface CommunityBounds {
  communityId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodePositions: Map<string, { x: number; y: number }>;
}

export interface UseAllCommunitiesLayoutOptions {
  nodes: Ref<Node[]>;
  edges: Ref<Edge[]>;
  communities: Ref<CommunityMap>;
  onPositionUpdate: (positions: Map<string, { x: number; y: number }>) => void;
}

const LIMITED_FORCE_ITERATIONS = 100;
const COMMUNITY_PADDING = 60;
const COMMUNITY_GAP = 120;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

export function useAllCommunitiesLayout(options: UseAllCommunitiesLayoutOptions) {
  const { nodes, edges, communities, onPositionUpdate } = options;
  const isRunning = ref(false);

  /**
   * Apply force layout to a single community with limited iterations
   */
  async function layoutCommunity(
    communityNodes: Node[],
    communityEdges: Edge[],
    communityLinks: SimulationLink[]
  ): Promise<{ positions: Map<string, { x: number; y: number }>; bounds: { width: number; height: number } }> {
    return new Promise((resolve) => {
      const positions = new Map<string, { x: number; y: number }>();

      if (communityNodes.length === 0) {
        resolve({ positions, bounds: { width: 0, height: 0 } });
        return;
      }

      if (communityNodes.length === 1) {
        positions.set(communityNodes[0].id, { x: 0, y: 0 });
        resolve({ positions, bounds: { width: 200, height: 100 } });
        return;
      }

      // Create refs for the force layout
      const nodesRef = ref(communityNodes);
      const linksRef = ref(communityLinks);

      let finalPositions = new Map<string, { x: number; y: number }>();

      const forceLayout = useForceLayout({
        nodes: nodesRef,
        links: linksRef,
        config: {
          width: 400,
          height: 300,
          maxIterations: LIMITED_FORCE_ITERATIONS,
          preWarmTicks: LIMITED_FORCE_ITERATIONS,
        },
        onPositionUpdate: (pos) => {
          finalPositions = pos;
        },
      });

      forceLayout.start();

      // Wait a bit for the layout to complete
      setTimeout(() => {
        forceLayout.stop();

        // Calculate bounds
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;

        finalPositions.forEach(({ x, y }) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });

        // Normalize positions to start from 0,0
        const normalizedPositions = new Map<string, { x: number; y: number }>();
        finalPositions.forEach((pos, nodeId) => {
          normalizedPositions.set(nodeId, {
            x: pos.x - minX + COMMUNITY_PADDING,
            y: pos.y - minY + COMMUNITY_PADDING,
          });
        });

        resolve({
          positions: normalizedPositions,
          bounds: {
            width: maxX - minX + NODE_WIDTH + COMMUNITY_PADDING * 2,
            height: maxY - minY + NODE_HEIGHT + COMMUNITY_PADDING * 2,
          },
        });
      }, 50);
    });
  }

  /**
   * Apply layout to all communities arranged in a grid
   */
  async function applyLayout(): Promise<void> {
    if (nodes.value.length === 0 || communities.value.size === 0) {
      return;
    }

    isRunning.value = true;

    try {
      const communityBoundsList: CommunityBounds[] = [];
      const communityEntries = Array.from(communities.value.entries());

      // Sort by community size (largest first)
      communityEntries.sort(
        ([, nodesA], [, nodesB]) => nodesB.size - nodesA.size
      );

      // Step 1: Layout each community internally
      for (const [communityId, nodeIds] of communityEntries) {
        const communityNodes = nodes.value.filter((n) => nodeIds.has(n.id));
        const communityEdges = edges.value.filter(
          (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );
        const communityLinks: SimulationLink[] = communityEdges.map((e) => ({
          source: e.source,
          target: e.target,
        }));

        const result = await layoutCommunity(
          communityNodes,
          communityEdges,
          communityLinks
        );

        communityBoundsList.push({
          communityId,
          x: 0,
          y: 0,
          width: result.bounds.width,
          height: result.bounds.height,
          nodePositions: result.positions,
        });
      }

      // Step 2: Arrange communities in a flexible grid
      // Use a simple flow layout: place communities left to right, wrapping
      const maxRowWidth = Math.max(
        1200,
        Math.sqrt(communityBoundsList.reduce((sum, cb) => sum + cb.width * cb.height, 0)) * 1.5
      );

      let currentX = 0;
      let currentY = 0;
      let rowHeight = 0;

      communityBoundsList.forEach((cb) => {
        // Check if we need to wrap to next row
        if (currentX + cb.width > maxRowWidth && currentX > 0) {
          currentX = 0;
          currentY += rowHeight + COMMUNITY_GAP;
          rowHeight = 0;
        }

        cb.x = currentX;
        cb.y = currentY;

        currentX += cb.width + COMMUNITY_GAP;
        rowHeight = Math.max(rowHeight, cb.height);
      });

      // Step 3: Combine all positions with community offsets
      const allPositions = new Map<string, { x: number; y: number }>();

      communityBoundsList.forEach((cb) => {
        cb.nodePositions.forEach((localPos, nodeId) => {
          allPositions.set(nodeId, {
            x: cb.x + localPos.x,
            y: cb.y + localPos.y,
          });
        });
      });

      onPositionUpdate(allPositions);
    } finally {
      isRunning.value = false;
    }
  }

  function stop() {
    isRunning.value = false;
  }

  return {
    isRunning,
    applyLayout,
    stop,
  };
}
