<script setup lang="ts">
import { onMounted } from "vue";
import { useAsyncState } from "@vueuse/core";
import extensionCard from "@/components/extension/extensionCard/extensionCard.vue";
import installExtension from "@/components/extension/installExtension/installExtension.vue";
import { Extension } from "@/business/extension";

// Use useAsyncState for extensions with refetch capability
const { state: extensions, execute: refetchExtensions } = useAsyncState(
  () => Extension.list(),
  []
);

// --- lifecycle ---
onMounted(() => {
  refetchExtensions();
});

// --- methods ---
const onInstallExtension = () => {
  refetchExtensions();
};

const onToggleExtension = (extension: Extension) => {
  const action = extension.disabled ? extension.enable() : extension.disable();
  action.then(() => {
    refetchExtensions();
  });
};

const onEditConfig = () => {
  refetchExtensions();
};
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
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
