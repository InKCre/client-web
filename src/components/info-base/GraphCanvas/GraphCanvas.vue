<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Block } from "@/business/info-base/block";
import type { Relation } from "@/business/info-base/relation";
import BlockNode from "@/components/info-base/BlockNode/BlockNode.vue";
import RelationEdge from "@/components/info-base/RelationEdge/RelationEdge.vue";
import { NODE_COLLISION_RADIUS } from "@/components/info-base/BlockNode/BlockNode";
import { useForceLayout } from "@/utils/graph/force-layout";
import { DEFAULT_GRAPH_CONFIG } from "@/utils/graph/graph-types";
import type { PanState } from "./GraphCanvas";
import type { KonvaEventObject } from "konva/lib/Node";

const props = defineProps<{
  blocks: Block[];
  relations: Relation[];
  width: number;
  height: number;
  selectedBlockId: number | null;
}>();

const emit = defineEmits<{
  (e: "nodeClick", blockId: number): void;
}>();

// --- State ---
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const panState = ref<PanState>({
  isPanning: false,
  lastX: 0,
  lastY: 0,
});

// --- Force layout ---
const blocksRef = ref(props.blocks);
const relationsRef = ref(props.relations);

const { nodes, initLayout } = useForceLayout(blocksRef, relationsRef, {
  width: props.width,
  height: props.height,
  centerForce: 0.1,
  chargeForce: -800,
  linkDistance: NODE_COLLISION_RADIUS * 2.5, // Ensure links are long enough to not force overlap
  collideRadius: NODE_COLLISION_RADIUS,
  collideStrength: 1.0, // Maximum collision strength
  collideIterations: 4, // More iterations for accurate collision resolution
  alphaDecay: 0.02,
  preWarmTicks: 300, // Pre-calculate positions before first render
});

// Watch for prop changes
watch(
  () => [props.blocks, props.relations],
  () => {
    blocksRef.value = props.blocks;
    relationsRef.value = props.relations;
    initLayout();
  },
  { immediate: true, deep: true }
);

// --- Computed ---
const stageConfig = computed(() => ({
  width: props.width,
  height: props.height,
}));

const transformConfig = computed(() => ({
  x: panX.value,
  y: panY.value,
  scaleX: zoom.value,
  scaleY: zoom.value,
}));

const nodeMap = computed(() => {
  const map = new Map();
  nodes.value.forEach((node) => map.set(node.id, node));
  return map;
});

const edges = computed(() => {
  return props.relations
    .map((rel) => ({
      relation: rel,
      from: nodeMap.value.get(rel.from_),
      to: nodeMap.value.get(rel.to_),
    }))
    .filter((edge) => edge.from && edge.to);
});

// --- Methods ---
const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
  e.evt.preventDefault();

  const stage = e.target.getStage();
  if (!stage) return;

  const oldScale = zoom.value;
  const pointer = stage.getPointerPosition();
  if (!pointer) return;

  const mousePointTo = {
    x: (pointer.x - panX.value) / oldScale,
    y: (pointer.y - panY.value) / oldScale,
  };

  // Calculate new scale
  const direction = e.evt.deltaY > 0 ? -1 : 1;
  const newScale =
    direction > 0
      ? oldScale * DEFAULT_GRAPH_CONFIG.zoomStep
      : oldScale / DEFAULT_GRAPH_CONFIG.zoomStep;

  // Clamp zoom
  zoom.value = Math.max(
    DEFAULT_GRAPH_CONFIG.zoomMin,
    Math.min(DEFAULT_GRAPH_CONFIG.zoomMax, newScale)
  );

  // Adjust pan to zoom towards pointer
  panX.value = pointer.x - mousePointTo.x * zoom.value;
  panY.value = pointer.y - mousePointTo.y * zoom.value;
};

const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  // Only pan if clicking on empty canvas (not on a node)
  if (e.target === e.target.getStage()) {
    panState.value.isPanning = true;
    panState.value.lastX = e.evt.clientX;
    panState.value.lastY = e.evt.clientY;
  }
};

const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
  if (!panState.value.isPanning) return;

  const dx = e.evt.clientX - panState.value.lastX;
  const dy = e.evt.clientY - panState.value.lastY;

  panX.value += dx;
  panY.value += dy;

  panState.value.lastX = e.evt.clientX;
  panState.value.lastY = e.evt.clientY;
};

const handleMouseUp = () => {
  panState.value.isPanning = false;
};

const handleNodeClick = (blockId: number) => {
  emit("nodeClick", blockId);
};
</script>

<template>
  <div
    :class="['graph-canvas', { 'graph-canvas--panning': panState.isPanning }]"
  >
    <v-stage
      :config="stageConfig"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- Transform layer for zoom and pan -->
      <v-layer :config="transformConfig">
        <!-- Edges layer (rendered first, below nodes) -->
        <RelationEdge
          v-for="edge in edges"
          :key="edge.relation.id"
          :relation="edge.relation"
          :from="edge.from"
          :to="edge.to"
        />

        <!-- Nodes layer (rendered on top) -->
        <BlockNode
          v-for="node in nodes"
          :key="node.id"
          :block="blocks.find((b) => b.id === node.id)!"
          :position="node"
          :selected="selectedBlockId === node.id"
          @click="handleNodeClick(node.id)"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<style lang="scss" scoped src="./GraphCanvas.scss" />
