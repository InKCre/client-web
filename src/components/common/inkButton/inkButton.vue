<template>
  <button
    class="ink-button"
    :class="[
      `ink-button--${variant}`,
      `ink-button--${size}`,
      { 'ink-button--block': block, 'ink-button--disabled': disabled },
    ]"
    :type="type"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'
import type { InkButtonProps } from './inkButton'

withDefaults(defineProps<InkButtonProps>(), {
  variant: 'default',
  size: 'md',
  block: false,
  type: 'button',
  disabled: false,
})
</script>

<style lang="scss" src="./inkButton.scss" scoped></style>
