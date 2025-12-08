<script setup lang="ts">
import { computed } from "vue";
import { inkButtonProps, inkButtonEmits } from "./InkButton";

const props = defineProps(inkButtonProps);
const emit = defineEmits(inkButtonEmits);

const buttonClass = computed(() => [
  "ink-button",
  `ink-button--${props.type}`,
  `ink-button--${props.size}`,
]);
</script>

<template>
  <button :class="buttonClass" @click="emit('click')">
    <span>{{ text }}</span>
  </button>
</template>

<style lang="scss" scoped src="./InkButton.scss"></style>
