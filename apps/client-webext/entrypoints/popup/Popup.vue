<script setup lang="ts">
import Logo from "@/components/common/logo.vue";

function openOptionsPage() {
  browser.runtime.openOptionsPage();
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-text">
    <Logo />
    <div>Popup</div>

    <button class="btn mt-2" @click="openOptionsPage">Open Options</button>
  </main>
</template>

<style lang="scss">
/* Popup page styles using the design system tokens */
a {
  font-weight: 500;
  color: rgb(var(--color-brand));
  text-decoration: none;
  &:hover {
    /* Slightly darken brand on hover */
    color: color-mix(in srgb, rgb(var(--color-brand)) 85%, black 15%);
  }
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

.card {
  padding: 2em;
}
</style>
