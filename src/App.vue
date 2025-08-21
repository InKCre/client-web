<script setup lang="ts">
import FocusExplorer from './components/focusExplorer/focusExplorer.vue'
import { useBlocksStore } from './stores/blocks'
import { ref } from 'vue'
import type { Block } from './types/blocks'

const blocksStore = useBlocksStore()
const block = ref<Block | null>(blocksStore.getById(1) || null)
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="brand">
        <span class="brand-name">InKCre</span>
      </div>
    </div>
    <div class="app-content">
      <FocusExplorer v-model="block" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/main.scss' as *;

.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  position: relative;
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-xl);
  background: linear-gradient(
    90deg,
    var(--color-background) 0%,
    var(--color-background-muted) 100%
  );
  border-bottom: 1px solid var(--color-border);
  z-index: var(--z-fixed);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.brand-icon {
  font-size: var(--font-size-4xl);
  color: var(--color-text-soft);
  animation: rotate 1s linear infinite;
}

.brand-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  letter-spacing: var(--letter-spacing-widest);
  text-transform: uppercase;
}

.system-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-text {
  @include text-small-caps;
  color: var(--color-text-light);
}

.status-light {
  width: var(--space-sm);
  height: var(--space-sm);
  background: var(--color-text-muted);
  border-radius: var(--radius-full);
  animation: pulse 2s ease-in-out infinite;
}

.app-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: var(--space-4xl) var(--space-8xl);

  @include mobile {
    margin: var(--space-lg) var(--space-xl);
  }
}

// 边缘阴影效果
.app-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-border-light);
  pointer-events: none;
  z-index: var(--z-dropdown);
}
</style>
