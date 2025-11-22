<script setup lang="ts"></script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="brand">
        <img class="brand-logo" src="/favicon.ico" alt="InKCre Logo" />
        <router-link to="/" class="brand-name" style="text-decoration: none"> InKCre </router-link>
      </div>
    </div>
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './styles/main.scss' as *;

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--sys-color-content-text-primary);
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sys-space-scale-sm) var(--sys-space-scale-xl);
  background: linear-gradient(
    90deg,
    var(--sys-color-surface-bg-base) 0%,
    var(--sys-color-surface-bg-muted) 100%
  );
  border-bottom: 1px solid var(--sys-color-surface-border-strong);
  z-index: var(--z-fixed);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--sys-space-scale-md);
}

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
}

.brand-name {
  font-size: var(--sys-type-display-sm-size);
  font-weight: var(--sys-type-display-sm-weight);
  color: var(--sys-color-content-text-primary);
  letter-spacing: var(--letter-spacing-widest);
  text-transform: uppercase;
}

.system-status {
  display: flex;
  align-items: center;
  gap: var(--sys-space-scale-sm);
}

.status-text {
  @include text-small-caps;
  color: var(--sys-color-content-text-subtle);
}

.status-light {
  width: var(--sys-space-scale-sm);
  height: var(--sys-space-scale-sm);
  background: var(--sys-color-content-text-muted);
  border-radius: var(--sys-space-radius-full);
  animation: pulse 2s ease-in-out infinite;
}

.app-content {
  flex: 1;
  overflow-x: hidden;
  overflow-y: scroll;
  @include mobile {
    margin: var(--sys-space-scale-lg) var(--sys-space-scale-xl);
  }
}
</style>
