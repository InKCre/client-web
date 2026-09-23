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
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
}
</style>

<style>
body {
  margin: 0;
  font-family: var(--sys-typo-family-sans);
  font-size: var(--sys-font-body-md-font-size);
  font-weight: var(--sys-font-body-md-font-weight);
  letter-spacing: var(--sys-font-body-md-letter-spacing);
  line-height: var(--sys-font-body-md-line-height);
  color: var(--sys-color-text-base);
  background: var(--sys-color-surface-base);
}

a {
  color: inherit;
}
</style>
