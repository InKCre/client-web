<script setup lang="ts">
import { ref } from 'vue'

// --- data ---
const searchQuery = ref('')

// --- methods ---
const onSearch = () => {
  // Placeholder for search business logic
  console.log('Search for:', searchQuery.value)
}
</script>

<template>
  <main class="start-view">
    <h1 class="title">Find information helps you here.</h1>
    <input
      v-model="searchQuery"
      type="text"
      class="textarea"
      placeholder="Type your query..."
      @keydown.enter="onSearch"
    />
  </main>
</template>

<style lang="scss" scoped src="./start.scss"></style>
