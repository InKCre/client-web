<template>
  <button
    class="ink-button"
    :class="[variantClass, $attrs.class]"
    @click="$emit('click', $event)"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { InkButtonProps } from './inkButtonTypes'

const props = defineProps<InkButtonProps>()
const emit = defineEmits(['click'])

const variantClass = props.variant === 'primary' ? 'primary' : ''
</script>

<style lang="scss" src="./inkButton.scss" scoped></style>
