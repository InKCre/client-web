<script setup lang="ts">
import { computed } from "vue";
import type { Relation } from "@/business/info-base/relation";
import type { NodePosition } from "@/utils/graph/graph-types";
import {
  getControlPoint,
  getBezierMidpoint,
  EDGE_STROKE,
  EDGE_STROKE_WIDTH,
  EDGE_TEXT_COLOR,
  EDGE_TEXT_FONT_SIZE,
  EDGE_TEXT_PADDING,
  EDGE_TEXT_BG,
} from "./RelationEdge";

const props = defineProps<{
  relation: Relation;
  from: NodePosition;
  to: NodePosition;
}>();

// --- Computed ---
const controlPoint = computed(() => {
  return getControlPoint(
    { x: props.from.x, y: props.from.y },
    { x: props.to.x, y: props.to.y }
  );
});

const linePoints = computed(() => {
  const cp = controlPoint.value;
  return [
    props.from.x,
    props.from.y,
    cp.x,
    cp.y,
    props.to.x,
    props.to.y,
  ];
});

const lineConfig = computed(() => ({
  points: linePoints.value,
  stroke: EDGE_STROKE,
  strokeWidth: EDGE_STROKE_WIDTH,
  bezier: true,
  tension: 0,
}));

const labelPosition = computed(() => {
  return getBezierMidpoint(
    { x: props.from.x, y: props.from.y },
    controlPoint.value,
    { x: props.to.x, y: props.to.y }
  );
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
  <!-- Curve line -->
  <v-line :config="lineConfig" />

  <!-- Label with background -->
  <v-group v-if="labelText">
    <v-rect :config="labelBgConfig" />
    <v-text :config="labelTextConfig" />
  </v-group>
</template>

<style lang="scss" scoped src="./RelationEdge.scss" />
