<script setup lang="ts">
import { inkCardProps } from "./InkCard";

defineProps(inkCardProps);
</script>

<template>
  <div class="ink-card">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped src="./InkCard.scss" />
