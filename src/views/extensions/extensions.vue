<script setup lang="ts">
import { computed, ref } from "vue";
import { useAsyncState } from "@vueuse/core";
import extensionCard from "@/components/extension/extensionCard/extensionCard.vue";
import installExtension from "@/components/extension/installExtension/installExtension.vue";
import { InkLoading, InkDropdown, type DropdownOption } from "@inkcre/web-design";
import { Extension } from "@/business/extension";

// Use useAsyncState for extensions with refetch capability
const {
  state: extensions,
  execute: refetchExtensions,
  isLoading: extensionsLoading,
} = useAsyncState(() => Extension.list(), []);

// --- data ---
const selectedClientId = ref<string>("");
const clientOptions = ref<DropdownOption[]>([]);

// --- computed ---
// Extract all unique client IDs from extensions' enabled arrays
const availableClientIds = computed(() => {
  const clientIds = new Set<string>();
  extensions.value.forEach((ext) => {
    ext.enabled.forEach((id) => clientIds.add(id));
  });
  return Array.from(clientIds);
});

// Update client options when extensions change
const updateClientOptions = () => {
  const ids = availableClientIds.value;
  clientOptions.value = ids.map((id) => ({
    label: id,
    value: id,
  }));

  // Set default client ID if none selected
  if (ids.length > 0 && !selectedClientId.value) {
    selectedClientId.value = ids[0];
  }
};

// --- methods ---
const onInstallExtension = () => {
  refetchExtensions().then(() => {
    updateClientOptions();
  });
};

const updExtension = (updatedExtension: Extension) => {
  extensions.value = extensions.value.map((ext) =>
    ext.id === updatedExtension.id ? updatedExtension : ext
  );
  updateClientOptions();
};

// Initialize client options when extensions are loaded
refetchExtensions().then(() => {
  updateClientOptions();
});
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <div class="extensions-view__header">
        <InkDropdown
          v-model="selectedClientId"
          :options="clientOptions"
          :label="'Client ID'"
          :placeholder="'Select a client'"
        />
      </div>

      <InkLoading v-if="extensionsLoading" />
      <extensionCard
        v-for="extension in extensions"
        v-else
        :key="extension.id"
        :extension="extension"
        :client-id="selectedClientId"
        @toggle="updExtension"
        @edit-config="updExtension"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
