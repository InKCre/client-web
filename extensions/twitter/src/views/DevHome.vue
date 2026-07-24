<template>
  <div class="dev-home">
    <h1>Twitter Extension Dev Playground</h1>
    <p>This is a development environment for the Twitter extension.</p>
    <div class="dev-info">
      <h2>Registered Resolvers</h2>
      <p>The TweetResolver is registered for type: <code>tweet</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dev home component for testing extension functionality
</script>

<style scoped>
.dev-home {
  max-width: 800px;
  margin: 0 auto;
}

.dev-home h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.dev-home p {
  color: var(--ink-text-secondary, #888);
  margin-bottom: 1.5rem;
}

.dev-info {
  background: var(--ink-bg-secondary, #242424);
  padding: 1rem;
  border-radius: 8px;
}

.dev-info h2 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.dev-info code {
  background: var(--ink-bg-tertiary, #333);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
}
</style>
