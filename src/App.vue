<script setup lang="ts">
import InkHeader from "./components/common/InkHeader/inkHeader.vue";
</script>

<template>
  <div class="app">
    <InkHeader title="InKCre" />
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-content {
  flex: 1;
  overflow: hidden;
}
</style>

<style>
body {
  margin: 0;
}
</style>
