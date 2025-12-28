<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { InkDropdown, type DropdownOption } from "@inkcre/web-design";
import {
  LayoutType,
  type LayoutSelection,
} from "@/business/info-base/graph/layout-types";
import { TopologyType } from "@/business/info-base/graph/topology-types";

interface LayoutSelectorProps {
  selection: LayoutSelection;
}

interface LayoutSelectorEmits {
  (e: "layout-change", layoutType: LayoutType): void;
}

const props = defineProps<LayoutSelectorProps>();
const emit = defineEmits<LayoutSelectorEmits>();
const { t } = useI18n();

// Layout options for dropdown
const layoutOptions = computed<DropdownOption[]>(() => [
  {
    label: t("infoBase.graph.layout.auto", "Auto-detect"),
    value: LayoutType.Auto,
  },
  {
    label: t("infoBase.graph.layout.force", "Force-directed"),
    value: LayoutType.Force,
  },
  {
    label: t("infoBase.graph.layout.dagre", "Hierarchical"),
    value: LayoutType.Dagre,
  },
  {
    label: t("infoBase.graph.layout.circular", "Circular"),
    value: LayoutType.Circular,
  },
  {
    label: t("infoBase.graph.layout.radial", "Radial"),
    value: LayoutType.Radial,
  },
  {
    label: t("infoBase.graph.layout.grid", "Grid"),
    value: LayoutType.Grid,
  },
]);

// Selected value for dropdown
const selectedValue = computed({
  get: () => (props.selection.isAutoDetected ? LayoutType.Auto : props.selection.type),
  set: (value: LayoutType) => emit("layout-change", value),
});

// Get display name for detected topology
function getTopologyDisplayName(topology: TopologyType | string | undefined): string {
  if (!topology) return "";

  switch (topology) {
    case TopologyType.Tree:
      return t("infoBase.graph.topology.tree", "Tree");
    case TopologyType.DAG:
      return t("infoBase.graph.topology.dag", "DAG");
    case TopologyType.Star:
      return t("infoBase.graph.topology.star", "Star");
    case TopologyType.Linear:
      return t("infoBase.graph.topology.linear", "Linear");
    case TopologyType.Cyclic:
      return t("infoBase.graph.topology.cyclic", "Cyclic");
    case TopologyType.Disconnected:
      return t("infoBase.graph.topology.disconnected", "Disconnected");
    default:
      return t("infoBase.graph.topology.unknown", "Unknown");
  }
}

// Hint text showing detected topology when in auto mode
const topologyHint = computed(() => {
  if (!props.selection.isAutoDetected || !props.selection.detectedTopology) {
    return null;
  }
  return getTopologyDisplayName(props.selection.detectedTopology);
});
</script>

<template>
  <div class="layout-selector">
    <div class="layout-selector__dropdown">
      <InkDropdown
        v-model="selectedValue"
        :options="layoutOptions"
        :enable-stepping="true"
      />
    </div>

    <div v-if="topologyHint" class="layout-selector__hint">
      {{ t("infoBase.graph.layout.detected", "Detected") }}: {{ topologyHint }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./LayoutSelector.scss" />
