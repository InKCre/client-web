<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

const props = defineProps<SolvedContentRendererProps<string>>()

const displayText = computed(() => {
  const text = props.solvedContent
  const maxLen = 100
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
})
</script>

<template>
  <div class="content-text">
    <div class="content-text__content">{{ displayText }}</div>
  </div>
</template>

<style lang="scss" scoped>
.content-text {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

  &__content {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
