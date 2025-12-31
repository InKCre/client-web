<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { BlockNodeProps } from "./BlockNode";
import { blockNodeEmits } from "./BlockNode";
import { resolverManager } from "@/business/info-base/resolver";
import BlockContent from "../block/BlockContent/BlockContent.vue";

const props = defineProps<BlockNodeProps>();
const emit = defineEmits(blockNodeEmits);

const block = computed(() => props.data.block);
const relations = computed(() => props.data.relations);
const resolverType = computed(() => block.value.resolver);

// Create resolver instance with block and relations
const resolver = computed(() =>
  resolverManager.createResolver(block.value, relations.value)
);

// Fallback preview from props (pre-computed at graph level)
const fallbackPreview = computed(() => props.data.preview);

const onNodeClick = () => {
  emit("select", block.value.id);
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
    <BlockContent :block="block" />
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
