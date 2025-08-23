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
  color: var(--color-text);
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-lg);
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

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
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
  overflow-x: hidden;
  overflow-y: scroll;
  @include mobile {
    margin: var(--space-lg) var(--space-xl);
  }
}
</style>
