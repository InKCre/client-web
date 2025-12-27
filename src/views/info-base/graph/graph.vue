<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAsyncState } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { InkLoading } from "@inkcre/web-design";
import { Block } from "@/business/info-base/block";
import { Relation } from "@/business/info-base/relation";
import GraphCanvas from "@/components/info-base/GraphCanvas/GraphCanvas.vue";
import BlockDetailsPanel from "@/components/info-base/BlockDetailsPanel/BlockDetailsPanel.vue";

const { t } = useI18n();

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

const loading = computed(
  () => blocksLoading.value || relationsLoading.value
);

// --- State ---
const selectedBlockId = ref<number | null>(null);
const canvasWidth = ref(window.innerWidth - 400); // Subtract details panel width
const canvasHeight = ref(window.innerHeight);

// --- Computed ---
const selectedBlock = computed(() => {
  if (!selectedBlockId.value) return null;
  return blocks.value.find((block) => block.id === selectedBlockId.value) || null;
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
// Update canvas size on window resize
const updateCanvasSize = () => {
  const detailsPanelWidth = selectedBlockId.value ? 400 : 0;
  canvasWidth.value = window.innerWidth - detailsPanelWidth;
  canvasHeight.value = window.innerHeight;
};

window.addEventListener("resize", updateCanvasSize);
window.addEventListener("keydown", handleKeyDown);

// Watch for selection changes to update canvas size
watch(selectedBlockId, () => {
  updateCanvasSize();
});
</script>

<template>
  <main class="graph-view">
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
          :blocks="blocks"
          :relations="relations"
          :width="canvasWidth"
          :height="canvasHeight"
          :selectedBlockId="selectedBlockId"
          @nodeClick="handleNodeClick"
        />
      </div>

      <!-- Details panel -->
      <div
        :class="[
          'graph-view__details',
          { 'graph-view__details--hidden': !selectedBlock },
        ]"
      >
        <BlockDetailsPanel
          v-if="selectedBlock"
          :block="selectedBlock"
          :open="!!selectedBlock"
          @close="handleCloseDetails"
        />
      </div>
    </template>
  </main>
</template>

<style lang="scss" scoped src="./graph.scss" />
