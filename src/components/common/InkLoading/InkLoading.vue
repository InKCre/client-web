<script setup lang="ts">
import { computed } from "vue";
import { inkLoadingProps } from "./InkLoading";

const props = defineProps(inkLoadingProps);

const loadingClass = computed(() => [
  "ink-loading",
  `ink-loading--${props.size}`,
  `ink-loading--${props.density}`,
]);
</script>

<template>
  <div :class="loadingClass">
    <div class="ink-loading__block ink-loading__block--1"></div>
    <div class="ink-loading__block ink-loading__block--2"></div>
    <div class="ink-loading__block ink-loading__block--3"></div>
  </div>
</template>

<style lang="scss" scoped src="./InkLoading.scss" />
