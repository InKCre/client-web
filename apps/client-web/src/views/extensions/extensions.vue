<script setup lang="ts">
import { computed, ref } from "vue";
import { useAsyncState } from "@vueuse/core";
import extensionCard from "@/components/extension/extensionCard/extensionCard.vue";
import installExtension from "@/components/extension/installExtension/installExtension.vue";
import { InkLoading, InkDropdown } from "@inkcre/web-design";
import { Client } from "@inkcre/core";
import { Extension, configStore } from "@inkcre/core";

// --- data ---
const selectedClientId = ref<string>(configStore.metaConfig.INKCRE_CLIENT_ID);

const {
  state: extensions,
  execute: refetchExtensions,
  isLoading: extensionsLoading,
} = useAsyncState(() => Extension.list(), []);

// --- methods ---
const onInstallExtension = () => {
  refetchExtensions();
};

const updExtension = (updatedExtension: Extension) => {
  extensions.value = extensions.value.map((ext) =>
    ext.id === updatedExtension.id ? updatedExtension : ext
  );
};
</script>

<template>
  <main class="extensions-view">
    <installExtension @install="onInstallExtension" />

    <div class="extensions-view__list">
      <div class="extensions-view__header">
        <InkDropdown
          v-model="selectedClientId"
          :refresher="Client.listAsOptions"
          :label="'Client ID'"
          :placeholder="'Select a client'"
        />
      </div>

      <div v-if="extensionsLoading" class="flex items-center justify-center">
        <InkLoading />
      </div>
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
