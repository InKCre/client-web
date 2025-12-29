import Graph from "graphology";
import { singleSourceLength } from "graphology-shortest-path/unweighted";
import type { Edge } from "@vue-flow/core";
import type { CommunityMap } from "./community-types";

/**
 * Compute distance matrix for nodes within a community
 * Uses shortest path length in the graph as distance metric
 *
 * @param nodeIds - List of node IDs in the community
 * @param edges - Edges in the community subgraph
 * @returns n×n symmetric distance matrix
 */
export function computeIntraCommunityDistances(
  nodeIds: string[],
  edges: Edge[]
): number[][] {
  const n = nodeIds.length;

  if (n === 0) return [];
  if (n === 1) return [[0]];

  // Build a subgraph for this community
  const graph = new Graph({ type: "undirected" });
  const nodeSet = new Set(nodeIds);

  nodeIds.forEach((id) => graph.addNode(id));

  edges.forEach((edge) => {
    if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
      if (
        !graph.hasEdge(edge.source, edge.target) &&
        edge.source !== edge.target
      ) {
        graph.addEdge(edge.source, edge.target);
      }
    }
  });

  // Initialize distance matrix with Infinity
  const nodeIndex = new Map(nodeIds.map((id, i) => [id, i]));
  const distances: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(Infinity));

  // Set diagonal to 0
  for (let i = 0; i < n; i++) {
    distances[i][i] = 0;
  }

  // Compute shortest paths from each node using BFS
  for (const sourceId of nodeIds) {
    const lengths = singleSourceLength(graph, sourceId);
    const i = nodeIndex.get(sourceId)!;

    for (const [targetId, length] of Object.entries(lengths)) {
      const j = nodeIndex.get(targetId);
      if (j !== undefined) {
        distances[i][j] = length as number;
        distances[j][i] = length as number; // Symmetric
      }
    }
  }

  // Replace Infinity with max_distance + 1 for disconnected components
  // This ensures disconnected nodes are placed farther apart
  let maxFinite = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (distances[i][j] !== Infinity && distances[i][j] > maxFinite) {
        maxFinite = distances[i][j];
      }
    }
  }

  const defaultDistance = maxFinite > 0 ? maxFinite + 1 : 2;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (distances[i][j] === Infinity) {
        distances[i][j] = defaultDistance;
      }
    }
  }

  return distances;
}

/**
 * Compute distance matrix between communities
 * Based on number of inter-community edges (more edges = closer, smaller distance)
 *
 * @param communities - Map of community ID to set of node IDs
 * @param edges - All edges in the graph
 * @returns Distance matrix and ordered list of community IDs
 */
export function computeInterCommunityDistances(
  communities: CommunityMap,
  edges: Edge[]
): { distances: number[][]; communityIds: string[] } {
  const communityIds = Array.from(communities.keys());
  const n = communityIds.length;

  if (n === 0) {
    return { distances: [], communityIds: [] };
  }

  if (n === 1) {
    return { distances: [[0]], communityIds };
  }

  // Create node-to-community lookup
  const nodeToCommunity = new Map<string, string>();
  for (const [commId, nodeIds] of communities) {
    for (const nodeId of nodeIds) {
      nodeToCommunity.set(nodeId, commId);
    }
  }

  // Count edges between each pair of communities
  const edgeCounts = new Map<string, number>();

  for (const edge of edges) {
    const sourceComm = nodeToCommunity.get(edge.source);
    const targetComm = nodeToCommunity.get(edge.target);

    if (sourceComm && targetComm && sourceComm !== targetComm) {
      // Create canonical key for community pair (sorted to ensure consistency)
      const key = [sourceComm, targetComm].sort().join("|");
      edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
    }
  }

  // Find max edge count for normalization
  const maxEdges = Math.max(1, ...edgeCounts.values());

  // Convert edge counts to distances
  // More edges = smaller distance = closer positioning
  // Formula: distance = 1 / (1 + count/maxEdges * 9)
  // - 0 edges: distance = 1.0 (farthest)
  // - max edges: distance ≈ 0.1 (closest)
  const distances: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = [communityIds[i], communityIds[j]].sort().join("|");
      const count = edgeCounts.get(key) || 0;

      // Inverse relationship: more edges = smaller distance
      const distance = 1.0 / (1 + (count / maxEdges) * 9);

      distances[i][j] = distance;
      distances[j][i] = distance;
    }
  }

  return { distances, communityIds };
}
