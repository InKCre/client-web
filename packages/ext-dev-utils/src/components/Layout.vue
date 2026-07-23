<template>
  <div class="ext-dev-layout">
    <header class="ext-dev-header">
      <div class="ext-dev-logo">InKCre Extension Dev</div>
      <div class="ext-dev-extension-name">{{ extensionName }}</div>
    </header>
    <main class="ext-dev-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  extensionName?: string
}>()
</script>

<style scoped>
.ext-dev-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--ink-bg-primary, #1a1a1a);
  color: var(--ink-text-primary, #fff);
}

.ext-dev-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--ink-border-primary, #333);
  background: var(--ink-bg-secondary, #242424);
}

.ext-dev-logo {
  font-weight: 600;
  color: var(--ink-text-secondary, #888);
}

.ext-dev-extension-name {
  color: var(--ink-text-primary, #fff);
}

.ext-dev-main {
  flex: 1;
  padding: 16px;
}
</style>
