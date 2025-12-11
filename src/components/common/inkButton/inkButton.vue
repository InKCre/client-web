<script setup lang="ts">
import { computed } from "vue";
import { inkButtonProps, inkButtonEmits } from "./inkButton";

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
    <slot>
      <span>{{ text }}</span>
    </slot>
  </button>
</template>

<style lang="scss" scoped src="./inkButton.scss"></style>
