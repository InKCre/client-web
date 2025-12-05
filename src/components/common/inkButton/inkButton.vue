<script setup lang="ts">
import { inkButtonProps, inkButtonEmits } from "./InkButton";

const props = defineProps(inkButtonProps);
const emit = defineEmits(inkButtonEmits);

const buttonClass = `ink-button ink-button--${props.type}`;
</script>

<template>
  <button :class="buttonClass">
    <span>{{ text }}</span>
  </button>
</template>

<style lang="scss" scoped src="./InkButton.scss"></style>
