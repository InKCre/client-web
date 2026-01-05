<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import type { BlockNodeProps } from "./BlockNode";
import { blockNodeEmits } from "./BlockNode";
import BlockContent from "../block/BlockContent/BlockContent.vue";

const props = defineProps<BlockNodeProps>();
const emit = defineEmits(blockNodeEmits);

const onNodeClick = () => {
  emit("select", props.data.block.id);
};
</script>

<template>
  <!-- Handles for edge connections - positioned at all sides for flexible routing -->
  <Handle type="target" :position="Position.Top" class="block-node__handle" />
  <Handle type="target" :position="Position.Left" class="block-node__handle" />
  <Handle
    type="source"
    :position="Position.Bottom"
    class="block-node__handle"
  />
  <Handle type="source" :position="Position.Right" class="block-node__handle" />

  <div
    class="block-node"
    :class="{ 'block-node--selected': selected }"
    @click="onNodeClick"
  >
    <BlockContent :block="props.data.block" />
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
