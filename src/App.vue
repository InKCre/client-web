<script setup lang="ts">
import InkHeader from './components/inkHeader/inkHeader.vue'
</script>

<template>
  <InkHeader />
  <div class="app-content">
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
@use './styles/main.scss' as *;

.app-content {
  flex: 1;
  overflow-x: hidden;
  overflow-y: scroll;

  @include mobile {
    margin: var(--space-lg) var(--space-xl);
  }
}
</style>
