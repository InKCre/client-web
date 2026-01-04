<template>
  <img :src="logo" alt="InKCre Logo" class="ink-logo" />
</template>

<script setup lang="ts">
import logo from "~/assets/inkcre.svg";
</script>

<style scoped>
.ink-logo {
  width: 32px;
  height: 32px;
}
</style>
