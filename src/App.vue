<script setup lang="ts">
import InkHeader from './components/common/inkHeader/inkHeader.vue'
</script>

<template>
  <InkHeader title="InKCre" />
  <div class="app-content">
    <router-view />
  </div>
</template>

<style lang="scss" scoped>
@use './styles/index.scss' as *;

.app-content {
  flex: 1;
  overflow-x: hidden;
  overflow-y: scroll;

  @include mobile {
    margin: var(--sys-space-scale-lg) var(--sys-space-scale-xl);
  }
}
</style>
