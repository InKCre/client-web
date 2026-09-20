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

<style scoped lang="scss">
@use '@inkcre/ui-web/styles/mixins' as *;
.ext-dev-layout {
  @include apply-font(body-md);
  overflow-wrap: anywhere;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--sys-color-surface-base);
  color: var(--sys-color-text-base);
}

.ext-dev-header {
  min-height: 48px;
  box-sizing: border-box;
  flex-wrap: wrap;
  padding: var(--sys-space-sm) var(--sys-space-md);
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--sys-color-border-base);
  background: var(--sys-color-surface-subtle);
}

.ext-dev-logo {
  @include apply-font(label-lg);
  color: var(--sys-color-text-subtle);
}

.ext-dev-extension-name {
  @include apply-font(label-lg);
  color: var(--sys-color-text-base);
}

.ext-dev-main {
  flex: 1;
  padding: 16px;
}
</style>
