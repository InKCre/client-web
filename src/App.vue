<script setup lang="ts">
import { ref } from "vue";
import { InkHeader } from "@inkcre/web-design";
import AppSidePanel from "./components/common/AppSidePanel/AppSidePanel.vue";
import router from "./router";

// --- data ---
const sidebarExpanded = ref(false);
</script>

<template>
  <div class="app">
    <InkHeader
      title="InKCre"
      @menu-click="sidebarExpanded = !sidebarExpanded"
      @title-click="router.push('/')"
    />
    <div class="app-content">
      <router-view />
      <AppSidePanel v-model:expanded="sidebarExpanded" />
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
  display: flex;
}
</style>

<style>
body {
  margin: 0;
  font-size: 14px;
  color: #000;
}
</style>
