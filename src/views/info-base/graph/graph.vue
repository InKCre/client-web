<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { MiniMap } from "@vue-flow/minimap";
import { InkPopup, InkLoading, InkButton } from "@inkcre/web-design";
import { useElementSize } from "@vueuse/core";

import BlockNodeComponent from "@/components/info-base/BlockNode/BlockNode.vue";
import RelationEdgeComponent from "@/components/info-base/RelationEdge/RelationEdge.vue";
import BlockDetailsPanel from "@/components/info-base/BlockDetailsPanel/BlockDetailsPanel.vue";
import CommunityNavigator from "@/components/info-base/CommunityNavigator/CommunityNavigator.vue";
import LayoutSelector from "@/components/info-base/LayoutSelector/LayoutSelector.vue";

import { Block } from "@/business/info-base/block";
import { Relation } from "@/business/info-base/relation";
import { resolverRegistry } from "@/business/info-base/resolver";
import { LayoutType } from "@/business/info-base/graph/layout-types";

import { useLayoutManager } from "@/composables/useLayoutManager";
import { useAllCommunitiesLayout } from "@/composables/useAllCommunitiesLayout";
import { useCommunityDetection } from "@/composables/useCommunityDetection";
import type { Node, Edge } from "@vue-flow/core";
import {
  blockToNode,
  relationToEdge,
  type BlockNode,
  type BlockNodeData,
  type SimulationLink,
} from "@/business/info-base/graph/graph-types";

const { t } = useI18n();

// Container ref for sizing
const containerRef = ref<HTMLElement | null>(null);
const { width, height } = useElementSize(containerRef);

// Data state
const isLoading = ref(true);
const allNodes = ref<BlockNode[]>([]);
const allEdges = ref<Edge[]>([]);
const links = ref<SimulationLink[]>([]);
const selectedCommunityId = ref<string>("all");

// Community detection
const {
  communities,
  communityMetadata,
  isDetecting: isDetectingCommunities,
  getCommunityNodes,
} = useCommunityDetection({
  nodes: allNodes,
  edges: allEdges,
});

// Filtered data based on selected community
const filteredNodes = computed(() => {
  if (selectedCommunityId.value === "all") {
    return allNodes.value;
  }
  const nodeIds = new Set(getCommunityNodes(selectedCommunityId.value));
  return allNodes.value.filter((node) => nodeIds.has(node.id));
});

const filteredEdges = computed(() => {
  if (selectedCommunityId.value === "all") {
    return allEdges.value;
  }
  const nodeIds = new Set(filteredNodes.value.map((n) => n.id));
  return allEdges.value.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
});

const filteredLinks = computed<SimulationLink[]>(() => {
  if (selectedCommunityId.value === "all") {
    return links.value;
  }
  const nodeIds = new Set(filteredNodes.value.map((n) => n.id));
  return links.value.filter(
    (link) => nodeIds.has(link.source) && nodeIds.has(link.target)
  );
});

// Selected block for details panel
const selectedBlock = ref<Block | null>(null);
const isPanelOpen = computed({
  get: () => selectedBlock.value !== null,
  set: (val) => {
    if (!val) {
      selectedBlock.value = null;
    }
  },
});

// Vue Flow instance
const {
  onNodeDrag,
  onNodeDragStart,
  onNodeDragStop,
  fitView,
  zoomIn,
  zoomOut,
} = useVueFlow();

// Handle position updates from layouts
const handlePositionUpdate = (
  positions: Map<string, { x: number; y: number }>
) => {
  allNodes.value = allNodes.value.map((node) => {
    const pos = positions.get(node.id);
    if (pos) {
      return { ...node, position: { x: pos.x, y: pos.y } };
    }
    return node;
  });
};

// Layout manager (use filtered data for single community)
const layoutManager = useLayoutManager({
  nodes: filteredNodes,
  edges: filteredEdges,
  links: filteredLinks,
  width: 800,
  height: 600,
  onPositionUpdate: handlePositionUpdate,
});

// All-communities layout (use all data)
const allCommunitiesLayout = useAllCommunitiesLayout({
  nodes: allNodes,
  edges: allEdges,
  communities,
  onPositionUpdate: handlePositionUpdate,
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
    allNodes.value = blocks.map((block) => {
      const resolver = resolverRegistry.get(block.resolver);
      const preview = resolver.preview(block.content, 50);
      return blockToNode(block, preview);
    });

    // Transform relations to edges and links
    allEdges.value = relations.map(relationToEdge);
    links.value = relations.map((rel) => ({
      source: String(rel.from_),
      target: String(rel.to_),
    }));
  } catch (error) {
    console.error("Failed to load graph data:", error);
  } finally {
    isLoading.value = false;
  }
};

// Handle node selection
const onNodeSelect = (blockId: number) => {
  const node = allNodes.value.find(
    (n: BlockNode) => n.data?.block.id === blockId
  );
  if (node?.data) {
    selectedBlock.value = node.data.block;
  }
};

// Handle panel close
const onPanelClose = () => {
  selectedBlock.value = null;
};

// Fit view options with max zoom limit to prevent over-zooming on small communities
const fitViewOptions = { padding: 0.2, maxZoom: 1.5 };

// Handle community selection
const onCommunitySelect = (communityId: string) => {
  selectedCommunityId.value = communityId;

  // Apply appropriate layout
  if (communityId === "all") {
    allCommunitiesLayout.applyLayout();
  } else {
    layoutManager.applyLayout();
  }

  // Auto fit-view after layout stabilizes
  setTimeout(() => fitView(fitViewOptions), 500);
};

// Handle layout change from UI
const onLayoutChange = (layoutType: LayoutType) => {
  layoutManager.setLayout(layoutType);
  setTimeout(() => fitView(fitViewOptions), 300);
};

// Control handlers
const onZoomIn = () => zoomIn();
const onZoomOut = () => zoomOut();
const onFitView = () => fitView(fitViewOptions);

// Track if user is dragging to prevent auto-fitView
const isDragging = ref(false);

// Handle node dragging - update simulation position during drag
onNodeDragStart(() => {
  isDragging.value = true;
  layoutManager.forceLayout.stop();
});

onNodeDrag(({ node }) => {
  // Continuously update the simulation node position during drag
  layoutManager.forceLayout.fixNode(node.id, node.position.x, node.position.y);
});

onNodeDragStop(({ node }) => {
  // Keep node fixed at final position and restart simulation
  layoutManager.forceLayout.fixNode(node.id, node.position.x, node.position.y);
  // Only restart if using force layout
  if (layoutManager.effectiveLayout.value === LayoutType.Force) {
    layoutManager.forceLayout.restart();
  }
  isDragging.value = false;
});

// Fit view after simulation stabilizes (but not during manual dragging)
watch(
  () => layoutManager.forceLayout.isRunning.value,
  (running, wasRunning) => {
    if (!running && wasRunning && !isDragging.value) {
      setTimeout(() => fitView(fitViewOptions), 100);
    }
  }
);

// Apply layout when data loading completes
watch(isLoading, (loading, wasLoading) => {
  if (!loading && wasLoading && allNodes.value.length > 0) {
    if (selectedCommunityId.value === "all") {
      allCommunitiesLayout.applyLayout();
    } else {
      layoutManager.applyLayout();
    }
    setTimeout(() => fitView(fitViewOptions), 500);
  }
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div ref="containerRef" class="graph-view">
    <div
      v-if="isLoading"
      class="flex items-center justify-center w-full h-full"
    >
      <InkLoading />
    </div>

    <template v-else>
      <!-- Top controls: Community Navigator and Layout Selector -->
      <div v-if="allNodes.length > 0" class="graph-view__top-controls">
        <CommunityNavigator
          :communities="communityMetadata"
          :current-community-id="selectedCommunityId"
          @community-select="onCommunitySelect"
        />
        <LayoutSelector
          v-if="selectedCommunityId !== 'all'"
          :selection="layoutManager.layoutSelection.value"
          @layout-change="onLayoutChange"
        />
      </div>

      <div v-if="allNodes.length === 0" class="graph-view__empty">
        {{ t("infoBase.graph.empty", "No blocks to display") }}
      </div>

      <VueFlow
        v-else
        :nodes="filteredNodes"
        :edges="filteredEdges"
        class="graph-view__flow"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.1"
        :max-zoom="4"
        :nodes-draggable="true"
        fit-view-on-init
      >
        <template #node-block="nodeProps">
          <BlockNodeComponent v-bind="nodeProps" @select="onNodeSelect" />
        </template>

        <template #edge-relation="edgeProps">
          <RelationEdgeComponent v-bind="edgeProps" />
        </template>

        <Background pattern-color="#e5e7eb" :gap="20" />
        <div class="graph-view__controls">
          <InkButton
            icon="i-mdi-plus"
            type="square"
            theme="subtle"
            size="md"
            @click="onZoomIn"
          />
          <InkButton
            icon="i-mdi-minus"
            type="square"
            theme="subtle"
            size="md"
            @click="onZoomOut"
          />
          <InkButton
            icon="i-mdi-fit-to-screen"
            type="square"
            theme="subtle"
            size="md"
            @click="onFitView"
          />
        </div>
        <MiniMap
          v-if="filteredNodes.length > 20"
          :node-color="() => '#3b82f6'"
          :node-stroke-color="() => '#1e40af'"
          :mask-color="'rgba(0, 0, 0, 0.1)'"
        />
      </VueFlow>

      <InkPopup v-model:open="isPanelOpen" position="right">
        <BlockDetailsPanel
          v-if="selectedBlock"
          :block="selectedBlock"
          style="width: 400px"
          @close="onPanelClose"
        />
      </InkPopup>
    </template>
  </div>
</template>

<style lang="scss" scoped src="./graph.scss" />
