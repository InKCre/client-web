<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { BlockNodeProps } from "./BlockNode";
import { blockNodeEmits } from "./BlockNode";

const props = defineProps<BlockNodeProps>();
const emit = defineEmits(blockNodeEmits);

const preview = computed(() => props.data.preview);
const blockId = computed(() => props.data.block.id);
const resolverType = computed(() => props.data.block.resolver);

const onNodeClick = () => {
  emit("select", blockId.value);
};
</script>

<template>
  <div
    class="block-node"
    :class="{ 'block-node--selected': selected }"
    @click="onNodeClick"
  >
    <div class="block-node__content">
      <div class="block-node__resolver">{{ resolverType }}</div>
      <div class="block-node__preview">{{ preview }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
