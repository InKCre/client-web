<script setup lang="ts">
import { computed } from "vue";
import type { Relation } from "@/business/info-base/relation";
import type { NodePosition } from "@/utils/graph/graph-types";
import {
  getControlPoint,
  getBezierMidpoint,
  getEdgeEndpoints,
  EDGE_STROKE,
  EDGE_STROKE_WIDTH,
  EDGE_TEXT_COLOR,
  EDGE_TEXT_FONT_SIZE,
  EDGE_TEXT_PADDING,
  EDGE_TEXT_BG,
  ARROW_POINTER_LENGTH,
  ARROW_POINTER_WIDTH,
  ARROW_FILL,
} from "./RelationEdge";

const props = defineProps<{
  relation: Relation;
  from: NodePosition;
  to: NodePosition;
}>();

// --- Computed ---

// Calculate edge endpoints on node boundaries for shortest path
const edgeEndpoints = computed(() => {
  return getEdgeEndpoints(
    { x: props.from.x, y: props.from.y },
    { x: props.to.x, y: props.to.y }
  );
});

const controlPoint = computed(() => {
  const { from, to } = edgeEndpoints.value;
  return getControlPoint(from, to);
});

// Arrow points: [startX, startY, controlX, controlY, endX, endY]
const arrowPoints = computed(() => {
  const { from, to } = edgeEndpoints.value;
  const cp = controlPoint.value;
  return [from.x, from.y, cp.x, cp.y, to.x, to.y];
});

const arrowConfig = computed(() => ({
  points: arrowPoints.value,
  stroke: EDGE_STROKE,
  strokeWidth: EDGE_STROKE_WIDTH,
  fill: ARROW_FILL,
  tension: 0.5,
  pointerLength: ARROW_POINTER_LENGTH,
  pointerWidth: ARROW_POINTER_WIDTH,
  pointerAtBeginning: false,
  pointerAtEnding: true,
  lineCap: "round",
  lineJoin: "round",
}));

const labelPosition = computed(() => {
  const { from, to } = edgeEndpoints.value;
  return getBezierMidpoint(from, controlPoint.value, to);
});

const labelText = computed(() => {
  return props.relation.content || "";
});

const labelBgConfig = computed(() => {
  const labelWidth = labelText.value.length * (EDGE_TEXT_FONT_SIZE * 0.6);
  const labelHeight = EDGE_TEXT_FONT_SIZE + EDGE_TEXT_PADDING * 2;

  return {
    x: labelPosition.value.x - labelWidth / 2 - EDGE_TEXT_PADDING,
    y: labelPosition.value.y - labelHeight / 2,
    width: labelWidth + EDGE_TEXT_PADDING * 2,
    height: labelHeight,
    fill: EDGE_TEXT_BG,
    cornerRadius: 3,
    opacity: 0.9,
  };
});

const labelTextConfig = computed(() => ({
  x: labelPosition.value.x,
  y: labelPosition.value.y,
  text: labelText.value,
  fontSize: EDGE_TEXT_FONT_SIZE,
  fontFamily: "Arial, sans-serif",
  fill: EDGE_TEXT_COLOR,
  align: "center",
  verticalAlign: "middle",
  offsetX: (labelText.value.length * (EDGE_TEXT_FONT_SIZE * 0.6)) / 2,
  offsetY: EDGE_TEXT_FONT_SIZE / 2,
}));
</script>

<template>
  <!-- Curved arrow with direction indicator -->
  <v-arrow :config="arrowConfig" />

  <!-- Label with background -->
  <v-group v-if="labelText">
    <v-rect :config="labelBgConfig" />
    <v-text :config="labelTextConfig" />
  </v-group>
</template>

<style lang="scss" scoped src="./RelationEdge.scss" />
