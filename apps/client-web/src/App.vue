<script setup lang="ts">
import { ref, provide } from 'vue'
import { InkHeader } from '@inkcre/ui-web'
import AppSidePanel from './components/common/AppSidePanel/AppSidePanel.vue'
import router from './router'
import { createInkRouterAdapter } from './router'
import { INK_ROUTER_KEY } from '@inkcre/ui-web'
import { useRoute } from 'vue-router'
import RecallSearch from './components/recall/RecallSearch.vue'

provide(INK_ROUTER_KEY, createInkRouterAdapter(router, useRoute()))

// --- data ---
const sidebarExpanded = ref(false)
</script>

<template>
  <div class="app">
    <InkHeader
      title="InKCre"
      logo-src="/logo/32.svg"
      @menu-click="sidebarExpanded = !sidebarExpanded"
      @title-click="router.push('/')"
    />
    <div class="app-content">
      <router-view />
      <AppSidePanel v-model:expanded="sidebarExpanded" />
    </div>
    <RecallSearch />
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
