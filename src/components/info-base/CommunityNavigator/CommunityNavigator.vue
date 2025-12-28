<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { InkButton, InkDropdown, InkField, type DropdownOption } from "@inkcre/web-design";
import type { CommunityMetadata } from "@/utils/graph/community-types";

interface CommunityNavigatorProps {
  communities: CommunityMetadata[];
  currentCommunityId: string;
}

interface CommunityNavigatorEmits {
  (e: "community-select", communityId: string): void;
}

const props = defineProps<CommunityNavigatorProps>();
const emit = defineEmits<CommunityNavigatorEmits>();
const { t } = useI18n();

// Search state
const searchQuery = ref("");

// Filtered communities based on search
const filteredCommunities = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.communities;
  }
  const query = searchQuery.value.toLowerCase();
  return props.communities.filter(
    (comm) =>
      comm.label.toLowerCase().includes(query) ||
      comm.nodeCount.toString().includes(query)
  );
});

// Dropdown options
const dropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: t("infoBase.graph.community.all"),
    value: "all",
  },
  ...filteredCommunities.value.map((comm) => ({
    label: `${comm.label} (${t("infoBase.graph.community.nodeCount", {
      count: comm.nodeCount,
    })})`,
    value: comm.id,
  })),
]);

// Selected value (for v-model with dropdown)
const selectedValue = computed({
  get: () => props.currentCommunityId,
  set: (value: string) => {
    emit("community-select", value);
  },
});

// Current index in filtered list
const currentIndex = computed(() => {
  if (props.currentCommunityId === "all") return -1;
  return filteredCommunities.value.findIndex(
    (c) => c.id === props.currentCommunityId
  );
});

// Navigation handlers
const navigatePrevious = () => {
  if (filteredCommunities.value.length === 0) return;

  if (currentIndex.value <= 0) {
    // Wrap to last
    const lastComm =
      filteredCommunities.value[filteredCommunities.value.length - 1];
    emit("community-select", lastComm.id);
  } else {
    emit("community-select", filteredCommunities.value[currentIndex.value - 1].id);
  }
};

const navigateNext = () => {
  if (filteredCommunities.value.length === 0) return;

  if (
    currentIndex.value >= filteredCommunities.value.length - 1 ||
    currentIndex.value === -1
  ) {
    // Wrap to first
    emit("community-select", filteredCommunities.value[0].id);
  } else {
    emit("community-select", filteredCommunities.value[currentIndex.value + 1].id);
  }
};

// Disable prev/next when no communities or only one
const hasMultipleCommunities = computed(() => props.communities.length > 1);
</script>

<template>
  <div class="community-navigator">
    <div class="community-navigator__search">
      <InkField label="">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('infoBase.graph.community.searchPlaceholder')"
          class="community-navigator__search-input"
        />
      </InkField>
    </div>

    <div class="community-navigator__controls">
      <InkDropdown
        v-model="selectedValue"
        :options="dropdownOptions"
        class="community-navigator__dropdown"
      />

      <div class="community-navigator__nav-buttons">
        <InkButton
          icon="i-mdi-chevron-left"
          type="square"
          theme="subtle"
          size="sm"
          :title="t('infoBase.graph.community.previous')"
          :disabled="!hasMultipleCommunities"
          @click="navigatePrevious"
        />
        <InkButton
          icon="i-mdi-chevron-right"
          type="square"
          theme="subtle"
          size="sm"
          :title="t('infoBase.graph.community.next')"
          :disabled="!hasMultipleCommunities"
          @click="navigateNext"
        />
      </div>
    </div>

    <div
      v-if="filteredCommunities.length === 0 && searchQuery"
      class="community-navigator__no-results"
    >
      {{ t("infoBase.graph.community.noResults") }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./CommunityNavigator.scss" />
