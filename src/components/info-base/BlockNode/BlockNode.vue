<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import type { BlockNodeProps } from "./BlockNode";
import { blockNodeEmits } from "./BlockNode";
import { useBlockContent } from "@/composables/useBlockContent";

const props = defineProps<BlockNodeProps>();
const emit = defineEmits(blockNodeEmits);

const block = computed(() => props.data.block);
const resolverType = computed(() => block.value.resolver);

// Use the composable to get raw content and resolver
const { rawContent, resolver, isLoading } = useBlockContent({
  block,
  autoFetch: true,
});

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
  <Handle type="source" :position="Position.Bottom" class="block-node__handle" />
  <Handle type="source" :position="Position.Right" class="block-node__handle" />

  <div
    class="block-node"
    :class="{ 'block-node--selected': selected }"
    @click="onNodeClick"
  >
    <!-- Loading state -->
    <div v-if="isLoading" class="block-node__content">
      <div class="block-node__resolver">{{ resolverType }}</div>
      <div class="block-node__preview block-node__preview--loading">
        Loading...
      </div>
    </div>

    <!-- Dynamic inGraph component -->
    <component
      v-else-if="rawContent !== null && resolver.inGraph"
      :is="resolver.inGraph"
      :block="block"
      :raw-content="rawContent"
      :is-selected="selected"
      :max-width="200"
      :max-height="150"
    />

    <!-- Fallback to static preview -->
    <div v-else class="block-node__content">
      <div class="block-node__resolver">{{ resolverType }}</div>
      <div class="block-node__preview">{{ fallbackPreview }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
