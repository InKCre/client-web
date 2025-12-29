<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import type { BlockNodeProps } from "./BlockNode";
import { blockNodeEmits } from "./BlockNode";
import { useBlockContent } from "@/composables/useBlockContent";
import { useNodeLoadingReporter } from "@/composables/useNodeLoadingTracker";

const props = defineProps<BlockNodeProps>();
const emit = defineEmits(blockNodeEmits);

const block = computed(() => props.data.block);
const resolverType = computed(() => block.value.resolver);
const nodeId = computed(() => String(block.value.id));

// Get loading tracker (may be null if not provided by parent)
const loadingTracker = useNodeLoadingReporter();

// Use the composable to get raw content and resolver
const { rawContent, resolver, isLoading } = useBlockContent({
  block,
  autoFetch: true,
  onLoadingChange: (loading) => {
    loadingTracker?.setLoading(nodeId.value, loading);
  },
});

// Cleanup: remove from tracking when node unmounts
onUnmounted(() => {
  loadingTracker?.untrack(nodeId.value);
});

// Fallback preview from props (pre-computed at graph level)
const fallbackPreview = computed(() => props.data.preview);

const onNodeClick = () => {
  emit("select", block.value.id);
};
</script>

<template>
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
