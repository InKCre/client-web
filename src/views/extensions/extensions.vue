<script setup lang="ts">
import { useAsyncState } from "@vueuse/core";
import extensionCard from "@/components/extension/extensionCard/extensionCard.vue";
import installExtension from "@/components/extension/installExtension/installExtension.vue";
import InkLoading from "@/components/common/InkLoading/InkLoading.vue";
import { Extension } from "@/business/extension";

// Use useAsyncState for extensions with refetch capability
const {
  state: extensions,
  execute: refetchExtensions,
  isLoading: extensionsLoading,
} = useAsyncState(() => Extension.list(), []);

// --- methods ---
const onInstallExtension = () => {
  refetchExtensions();
};

const onToggleExtension = (updatedExtension: Extension) => {
  extensions.value = extensions.value.map((ext) =>
    ext.id === updatedExtension.id ? updatedExtension : ext
  );
};

const onEditConfig = () => {
  refetchExtensions();
};
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <InkLoading v-if="extensionsLoading" />
      <!-- FIXME -->
      <extensionCard
        v-for="extension in extensions"
        :key="extension.id"
        :extension="extension"
        @toggle="onToggleExtension"
        @edit-config="onEditConfig"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./extensions.scss" />
