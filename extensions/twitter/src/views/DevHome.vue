<template>
  <div class="dev-home">
    <h1>Twitter Extension Dev Playground</h1>
    <p>This is a development environment for the Twitter extension.</p>
    <div class="dev-info">
      <h2>Registered Resolvers</h2>
      <p>The TweetResolver is registered for type: <code>extensions.twitter.tweet.v1</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dev home component for testing extension functionality
</script>

<style scoped lang="scss">
@use '@inkcre/ui-web/styles/mixins' as *;
.dev-home {
  max-width: 800px;
  margin: 0 auto;
}

.dev-home h1 {
  @include apply-font(title-lg);
  margin-bottom: 1rem;
}

.dev-home p {
  color: var(--sys-color-text-subtle);
  margin-bottom: 1.5rem;
}

.dev-info {
  background: var(--sys-color-surface-subtle);
  padding: 1rem;
}

.dev-info h2 {
  @include apply-font(title-sm);
  margin-bottom: 0.5rem;
}

.dev-info code {
  background: var(--sys-color-surface-subtle-hover);
  padding: 0.125rem 0.375rem;
  @include apply-font(body-sm, $mono: true);
}
</style>
