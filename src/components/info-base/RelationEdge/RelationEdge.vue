<script setup lang="ts">
import { computed } from "vue";
import { BezierEdge, EdgeLabelRenderer, getBezierPath, MarkerType } from "@vue-flow/core";
import type { RelationEdgeProps } from "./RelationEdge";

const props = defineProps<RelationEdgeProps>();

const label = computed(() => props.data?.relation?.content ?? "");

const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
});

const edgePath = computed(() => path.value[0]);
const labelX = computed(() => path.value[1]);
const labelY = computed(() => path.value[2]);
</script>

<template>
  <BezierEdge
    :id="id"
    :source-x="sourceX"
    :source-y="sourceY"
    :target-x="targetX"
    :target-y="targetY"
    :source-position="sourcePosition"
    :target-position="targetPosition"
    :marker-end="MarkerType.ArrowClosed"
    class="relation-edge"
  />

  <EdgeLabelRenderer v-if="label">
    <div
      class="relation-edge__label"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }"
    >
      {{ label }}
    </div>
  </EdgeLabelRenderer>
</template>

<style lang="scss" scoped src="./RelationEdge.scss" />
