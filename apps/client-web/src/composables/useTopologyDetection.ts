import { DirectedGraph } from "graphology";
import { hasCycle } from "graphology-dag";
import type { Node, Edge } from "@vue-flow/core";
import {
  TopologyType,
  type TopologyAnalysis,
  type TopologyMetrics,
  topologyToLayout,
} from "@inkcre/core";

/**
 * Build a graphology graph from Vue Flow nodes and edges
 */
function buildGraph(nodes: Node[], edges: Edge[]): DirectedGraph {
  const graph = new DirectedGraph();

  nodes.forEach((node) => {
    graph.addNode(node.id);
  });

  edges.forEach((edge) => {
    // Avoid duplicate edges
    if (!graph.hasEdge(edge.source, edge.target)) {
      graph.addEdge(edge.source, edge.target);
    }
  });

  return graph;
}

/**
 * Compute degree statistics for all nodes
 */
function computeDegrees(graph: DirectedGraph): {
  maxIn: number;
  maxOut: number;
  avgDegree: number;
  inDegrees: Map<string, number>;
  outDegrees: Map<string, number>;
} {
  const inDegrees = new Map<string, number>();
  const outDegrees = new Map<string, number>();
  let maxIn = 0;
  let maxOut = 0;
  let totalDegree = 0;

  graph.forEachNode((node) => {
    const inDeg = graph.inDegree(node);
    const outDeg = graph.outDegree(node);

    inDegrees.set(node, inDeg);
    outDegrees.set(node, outDeg);

    maxIn = Math.max(maxIn, inDeg);
    maxOut = Math.max(maxOut, outDeg);
    totalDegree += inDeg + outDeg;
  });

  const nodeCount = graph.order;
  const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

  return { maxIn, maxOut, avgDegree, inDegrees, outDegrees };
}

/**
 * Check if graph is connected (treating as undirected)
 */
function isConnected(graph: DirectedGraph): boolean {
  if (graph.order === 0) return true;
  if (graph.order === 1) return true;

  const visited = new Set<string>();
  const queue: string[] = [];

  // Start BFS from first node
  const firstNode = graph.nodes()[0];
  queue.push(firstNode);
  visited.add(firstNode);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Get all neighbors (both in and out for undirected connectivity)
    graph.forEachNeighbor(current, (neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  return visited.size === graph.order;
}

/**
 * Check if the graph is a tree (connected, acyclic, n-1 edges for n nodes)
 */
function isTree(
  graph: DirectedGraph,
  hasCycles: boolean,
  connected: boolean
): boolean {
  if (hasCycles) return false;
  if (!connected) return false;

  const nodeCount = graph.order;
  const edgeCount = graph.size;

  // A tree has exactly n-1 edges for n nodes
  return edgeCount === nodeCount - 1;
}

/**
 * Find root nodes (nodes with no incoming edges)
 */
function findRootNodes(
  graph: DirectedGraph,
  inDegrees: Map<string, number>
): string[] {
  const roots: string[] = [];

  inDegrees.forEach((degree, nodeId) => {
    if (degree === 0) {
      roots.push(nodeId);
    }
  });

  return roots;
}

/**
 * Find leaf nodes (nodes with no outgoing edges)
 */
function findLeafNodes(
  graph: DirectedGraph,
  outDegrees: Map<string, number>
): string[] {
  const leaves: string[] = [];

  outDegrees.forEach((degree, nodeId) => {
    if (degree === 0) {
      leaves.push(nodeId);
    }
  });

  return leaves;
}

/**
 * Detect star topology - one central node connected to most others
 * Star pattern: one node has >= 60% of all edges, others have low degree
 */
function detectStarCenter(
  graph: DirectedGraph,
  inDegrees: Map<string, number>,
  outDegrees: Map<string, number>
): { hasStarCenter: boolean; centerNodeId?: string } {
  if (graph.order < 3) {
    return { hasStarCenter: false };
  }

  const totalEdges = graph.size;
  if (totalEdges === 0) {
    return { hasStarCenter: false };
  }

  // Find node with highest total degree
  let maxDegreeNode: string | undefined;
  let maxDegree = 0;

  graph.forEachNode((node) => {
    const totalDegree = (inDegrees.get(node) ?? 0) + (outDegrees.get(node) ?? 0);
    if (totalDegree > maxDegree) {
      maxDegree = totalDegree;
      maxDegreeNode = node;
    }
  });

  if (!maxDegreeNode) {
    return { hasStarCenter: false };
  }

  // Check if this node has at least 60% of all edges
  const edgeThreshold = totalEdges * 0.6;
  const centerDegree =
    (inDegrees.get(maxDegreeNode) ?? 0) + (outDegrees.get(maxDegreeNode) ?? 0);

  // Also check that other nodes have low degree (mostly 1 or 2)
  let lowDegreeCount = 0;
  graph.forEachNode((node) => {
    if (node !== maxDegreeNode) {
      const degree = (inDegrees.get(node) ?? 0) + (outDegrees.get(node) ?? 0);
      if (degree <= 2) {
        lowDegreeCount++;
      }
    }
  });

  const otherNodesCount = graph.order - 1;
  const lowDegreeRatio = otherNodesCount > 0 ? lowDegreeCount / otherNodesCount : 0;

  // Star topology: center has high degree AND most others have low degree
  if (centerDegree >= edgeThreshold && lowDegreeRatio >= 0.7) {
    return { hasStarCenter: true, centerNodeId: maxDegreeNode };
  }

  return { hasStarCenter: false };
}

/**
 * Compute graph depth using BFS from root nodes
 */
function computeDepth(
  graph: DirectedGraph,
  rootNodes: string[]
): number | undefined {
  if (rootNodes.length === 0) return undefined;

  let maxDepth = 0;
  const visited = new Set<string>();

  rootNodes.forEach((root) => {
    const queue: Array<{ node: string; depth: number }> = [{ node: root, depth: 0 }];
    visited.add(root);

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);

      graph.forEachOutNeighbor(node, (neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, depth: depth + 1 });
        }
      });
    }
  });

  return maxDepth;
}

/**
 * Composable for detecting graph topology
 */
export function useTopologyDetection() {
  /**
   * Analyze graph topology and return analysis with suggested layout
   */
  function analyze(nodes: Node[], edges: Edge[]): TopologyAnalysis {
    // Handle empty graph
    if (nodes.length === 0) {
      return {
        type: TopologyType.Unknown,
        confidence: 1,
        metrics: {
          nodeCount: 0,
          edgeCount: 0,
          hasCycles: false,
          isConnected: true,
          maxInDegree: 0,
          maxOutDegree: 0,
          avgDegree: 0,
          hasStarCenter: false,
          rootNodes: [],
          leafNodes: [],
        },
        suggestedLayout: topologyToLayout(TopologyType.Unknown),
      };
    }

    // Build graph
    const graph = buildGraph(nodes, edges);

    // Compute metrics
    const hasCycles = hasCycle(graph);
    const connected = isConnected(graph);
    const { maxIn, maxOut, avgDegree, inDegrees, outDegrees } = computeDegrees(graph);
    const rootNodes = findRootNodes(graph, inDegrees);
    const leafNodes = findLeafNodes(graph, outDegrees);
    const starResult = detectStarCenter(graph, inDegrees, outDegrees);
    const depth = computeDepth(graph, rootNodes);

    const metrics: TopologyMetrics = {
      nodeCount: graph.order,
      edgeCount: graph.size,
      hasCycles,
      isConnected: connected,
      maxInDegree: maxIn,
      maxOutDegree: maxOut,
      avgDegree,
      hasStarCenter: starResult.hasStarCenter,
      starCenterNodeId: starResult.centerNodeId,
      rootNodes,
      leafNodes,
      depth,
    };

    // Apply decision tree
    let type: TopologyType;
    let confidence: number;

    // 1. Is tree?
    if (isTree(graph, hasCycles, connected)) {
      type = TopologyType.Tree;
      confidence = 0.95;
    }
    // 2. Is DAG (no cycles)?
    else if (!hasCycles && connected) {
      type = TopologyType.DAG;
      confidence = 0.9;
    }
    // 3. Has star topology?
    else if (starResult.hasStarCenter) {
      type = TopologyType.Star;
      confidence = 0.85;
    }
    // 4. Is linear (simple chain)?
    else if (
      connected &&
      !hasCycles &&
      avgDegree <= 2 &&
      rootNodes.length === 1 &&
      leafNodes.length === 1
    ) {
      type = TopologyType.Linear;
      confidence = 0.9;
    }
    // 5. Disconnected?
    else if (!connected) {
      type = TopologyType.Disconnected;
      confidence = 1;
    }
    // 6. Has cycles
    else if (hasCycles) {
      type = TopologyType.Cyclic;
      confidence = 0.8;
    }
    // 7. Unknown
    else {
      type = TopologyType.Unknown;
      confidence = 0.5;
    }

    return {
      type,
      confidence,
      metrics,
      suggestedLayout: topologyToLayout(type),
    };
  }

  return {
    analyze,
  };
}
