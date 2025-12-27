<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useAsyncState, useElementSize } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { InkLoading, InkPopup } from "@inkcre/web-design";
import { Block } from "@/business/info-base/block";
import { Relation } from "@/business/info-base/relation";
import GraphCanvas from "@/components/info-base/GraphCanvas/GraphCanvas.vue";
import BlockDetailsPanel from "@/components/info-base/BlockDetailsPanel/BlockDetailsPanel.vue";

const { t } = useI18n();

// --- State ---
const graphViewRef = ref<HTMLElement | null>(null);
const { width: canvasWidth, height: canvasHeight } =
  useElementSize(graphViewRef);

// --- Data fetching ---
const {
  state: blocks,
  execute: refetchBlocks,
  isLoading: blocksLoading,
} = useAsyncState(() => Block.getAll(), []);

const {
  state: relations,
  execute: refetchRelations,
  isLoading: relationsLoading,
} = useAsyncState(() => Relation.getAll(), []);

const loading = computed(() => blocksLoading.value || relationsLoading.value);

// --- State ---
const selectedBlockId = ref<number | null>(null);

// --- Computed ---
const selectedBlock = computed(() => {
  if (!selectedBlockId.value) return null;
  return (
    blocks.value.find((block) => block.id === selectedBlockId.value) || null
  );
});

const isDetailsOpen = computed({
  get: () => !!selectedBlock.value,
  set: (val) => {
    if (!val) handleCloseDetails();
  },
});

const hasBlocks = computed(() => blocks.value.length > 0);

// --- Methods ---
const handleNodeClick = (blockId: number) => {
  selectedBlockId.value = blockId;
};

const handleCloseDetails = () => {
  selectedBlockId.value = null;
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    handleCloseDetails();
  }
};

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <main ref="graphViewRef" class="graph-view">
    <!-- Loading state -->
    <div v-if="loading" class="graph-view__loading">
      <InkLoading />
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasBlocks" class="graph-view__empty">
      <div class="graph-view__empty-icon">📊</div>
      <div class="graph-view__empty-text">
        {{ t("infoBase.graph.empty", "No blocks to display") }}
      </div>
    </div>

    <!-- Graph canvas -->
    <template v-else>
      <div class="graph-view__canvas">
        <GraphCanvas
          v-if="canvasWidth > 0 && canvasHeight > 0"
          :blocks="blocks"
          :relations="relations"
          :width="canvasWidth"
          :height="canvasHeight"
          :selectedBlockId="selectedBlockId"
          @nodeClick="handleNodeClick"
        />
      </div>

      <!-- Details panel -->
      <InkPopup v-model:open="isDetailsOpen" position="right">
        <BlockDetailsPanel
          v-if="selectedBlock"
          :block="selectedBlock"
          @close="handleCloseDetails"
        />
      </InkPopup>
    </template>
  </main>
</template>

<style lang="scss" scoped src="./graph.scss" />
