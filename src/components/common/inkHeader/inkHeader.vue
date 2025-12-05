<script setup lang="ts">
import { inkHeaderProps } from "./InkHeader";

defineProps(inkHeaderProps);
</script>

<template>
  <header class="ink-header">
    <div class="ink-header__logo">
      <img
        class="ink-header__logo-icon"
        src="@/static/logo/32.svg"
        alt="InKCre Logo"
      />
      <span class="ink-header__logo-text">{{ title }}</span>
    </div>
  </header>
</template>

<style lang="scss" scoped src="./InkHeader.scss"></style>
