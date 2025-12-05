<script setup lang="ts">
import { ref } from "vue";
import InkButton from "@/components/common/InkButton/InkButton.vue";

// --- data ---
const searchQuery = ref("");

// --- methods ---
const onSearch = () => {
  // Placeholder for search business logic
  console.log("Search for:", searchQuery.value);
};

const onSourcesClick = () => {
  // Placeholder for sources navigation
  console.log("Navigate to Sources");
};

const onExtensionsClick = () => {
  // Placeholder for extensions navigation
  console.log("Navigate to Extensions");
};

const onSettingsClick = () => {
  // Placeholder for settings navigation
  console.log("Navigate to Settings");
};
</script>

<template>
  <div class="start-view">
    <main class="start-view__uni-search">
      <h1 class="title">Find information helps you here.</h1>
      <input
        v-model="searchQuery"
        type="text"
        class="textarea"
        placeholder="Type your query..."
        @keydown.enter="onSearch"
      />
    </main>

    <aside class="start-view__sidebar">
      <div class="panel">
        <h2 class="panel-title">Managing</h2>
        <InkButton text="Sources" class="button" @click="onSourcesClick" />
        <InkButton
          text="Extensions"
          class="button"
          @click="onExtensionsClick"
        />
        <InkButton text="Settings" class="button" @click="onSettingsClick" />
      </div>
    </aside>
  </div>
</template>

<style lang="scss" scoped src="./Start.scss"></style>
