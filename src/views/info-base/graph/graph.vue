<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { InkPopup, InkLoading } from "@inkcre/web-design";
import { useElementSize } from "@vueuse/core";

import BlockNodeComponent from "@/components/info-base/BlockNode/BlockNode.vue";
import RelationEdgeComponent from "@/components/info-base/RelationEdge/RelationEdge.vue";
import BlockDetailsPanel from "@/components/info-base/BlockDetailsPanel/BlockDetailsPanel.vue";

import { Block } from "@/business/info-base/block";
import { Relation } from "@/business/info-base/relation";
import { resolverRegistry } from "@/business/info-base/resolver";

import { useForceLayout } from "@/composables/useForceLayout";
import type { Node, Edge } from "@vue-flow/core";
import {
  blockToNode,
  relationToEdge,
  type BlockNode,
  type BlockNodeData,
  type SimulationLink,
} from "@/utils/graph/graph-types";

const { t } = useI18n();

// Container ref for sizing
const containerRef = ref<HTMLElement | null>(null);
const { width, height } = useElementSize(containerRef);

// Data state
const isLoading = ref(true);
const nodes = ref<BlockNode[]>([]);
const edges = ref<Edge[]>([]);
const links = ref<SimulationLink[]>([]);

// Selected block for details panel
const selectedBlock = ref<Block | null>(null);
const isPanelOpen = computed(() => selectedBlock.value !== null);

// Vue Flow instance
const { onNodeDragStart, onNodeDragStop, fitView } = useVueFlow();

// Force layout
const forceLayout = useForceLayout({
  nodes,
  links,
  config: {
    width: 800,
    height: 600,
  },
});

// Load data
const loadData = async () => {
  isLoading.value = true;

  try {
    const [blocks, relations] = await Promise.all([
      Block.getAll(),
      Relation.getAll(),
    ]);

    // Transform blocks to nodes
    nodes.value = blocks.map((block) => {
      const resolver = resolverRegistry.get(block.resolver);
      const preview = resolver.preview(block.content, 50);
      return blockToNode(block, preview);
    });

    // Transform relations to edges and links
    edges.value = relations.map(relationToEdge);
    links.value = relations.map((rel) => ({
      source: String(rel.from_),
      target: String(rel.to_),
    }));

    // Start force simulation
    if (nodes.value.length > 0) {
      forceLayout.start();
    }
  } catch (error) {
    console.error("Failed to load graph data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Handle node selection
const onNodeSelect = (blockId: number) => {
  const node = nodes.value.find((n: BlockNode) => n.data?.block.id === blockId);
  if (node?.data) {
    selectedBlock.value = node.data.block;
  }
};

// Handle panel close
const onPanelClose = () => {
  selectedBlock.value = null;
};

// Handle node dragging - pause simulation during drag
onNodeDragStart(({ node }) => {
  forceLayout.fixNode(node.id, node.position.x, node.position.y);
});

onNodeDragStop(({ node }) => {
  forceLayout.unfixNode(node.id);
});

// Fit view after simulation stabilizes
watch(
  () => forceLayout.isRunning.value,
  (running, wasRunning) => {
    if (!running && wasRunning) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }
);

onMounted(() => {
  loadData();
});
</script>

<template>
  <div ref="containerRef" class="graph-view">
    <InkLoading v-if="isLoading" />

    <template v-else>
      <div v-if="nodes.length === 0" class="graph-view__empty">
        {{ t("infoBase.graph.empty", "No blocks to display") }}
      </div>

      <VueFlow
        v-else
        v-model:nodes="nodes"
        v-model:edges="edges"
        class="graph-view__flow"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.1"
        :max-zoom="4"
        fit-view-on-init
      >
        <template #node-block="nodeProps">
          <BlockNodeComponent v-bind="nodeProps" @select="onNodeSelect" />
        </template>

        <template #edge-relation="edgeProps">
          <RelationEdgeComponent v-bind="edgeProps" />
        </template>

        <Background pattern-color="#e5e7eb" :gap="20" />
        <Controls />
        <MiniMap
          :node-color="() => '#3b82f6'"
          :node-stroke-color="() => '#1e40af'"
          :mask-color="'rgba(0, 0, 0, 0.1)'"
        />
      </VueFlow>

      <InkPopup
        v-model:open="isPanelOpen"
        position="right"
        :width="400"
        :show-close="false"
      >
        <BlockDetailsPanel
          v-if="selectedBlock"
          :block="selectedBlock"
          @close="onPanelClose"
        />
      </InkPopup>
    </template>
  </div>
</template>

<style lang="scss" scoped src="./graph.scss" />
