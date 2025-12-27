<script setup lang="ts">
import { computed } from "vue";
import type { Block } from "@/business/info-base/block";
import type { NodePosition } from "@/utils/graph/graph-types";
import { resolverRegistry } from "@/business/info-base/resolver";
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_CORNER_RADIUS,
  NODE_FILL,
  NODE_STROKE,
  NODE_STROKE_SELECTED,
  NODE_TEXT_COLOR,
  NODE_SHADOW_COLOR,
  NODE_SHADOW_BLUR,
  NODE_SHADOW_BLUR_SELECTED,
  NODE_SHADOW_OPACITY,
  NODE_SHADOW_OPACITY_SELECTED,
} from "./BlockNode";

const props = defineProps<{
  block: Block;
  position: NodePosition;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: "click"): void;
}>();

// --- Computed ---
const preview = computed(() => {
  const resolver = resolverRegistry.get(props.block.resolver);
  return resolver.preview(props.block.content, 30);
});

const groupConfig = computed(() => ({
  x: props.position.x,
  y: props.position.y,
}));

const rectConfig = computed(() => ({
  x: -NODE_WIDTH / 2,
  y: -NODE_HEIGHT / 2,
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  fill: NODE_FILL,
  stroke: props.selected ? NODE_STROKE_SELECTED : NODE_STROKE,
  strokeWidth: props.selected ? 3 : 1,
  cornerRadius: NODE_CORNER_RADIUS,
  shadowColor: NODE_SHADOW_COLOR,
  shadowBlur: props.selected ? NODE_SHADOW_BLUR_SELECTED : NODE_SHADOW_BLUR,
  shadowOpacity: props.selected
    ? NODE_SHADOW_OPACITY_SELECTED
    : NODE_SHADOW_OPACITY,
}));

const textConfig = computed(() => ({
  x: -NODE_WIDTH / 2 + 5,
  y: -10,
  width: NODE_WIDTH - 10,
  text: preview.value,
  fontSize: 12,
  fontFamily: "Arial, sans-serif",
  fill: NODE_TEXT_COLOR,
  align: "center",
  ellipsis: true,
  wrap: "word",
}));

// --- Methods ---
const handleClick = () => {
  emit("click");
};
</script>

<template>
  <v-group :config="groupConfig" @click="handleClick">
    <v-rect :config="rectConfig" />
    <v-text :config="textConfig" />
  </v-group>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
