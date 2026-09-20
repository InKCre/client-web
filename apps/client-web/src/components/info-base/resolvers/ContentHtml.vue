<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'
const props = defineProps<SolvedContentRendererProps<string>>()

const displayContent = computed(() => {
  const textContent = stripHtml(props.solvedContent)
  return textContent || '[HTML]'
})

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
</script>

<template>
  <div class="content-html">
    <div class="content-html__badge">HTML</div>
    <div class="content-html__text">{{ displayContent }}</div>
  </div>
</template>

<style lang="scss" scoped>
.content-html {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

  &__badge {
    @include apply-font(label-md, $mono: true);
    color: sys-var(color, text, subtle);
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  &__text {
    @include apply-font(body-md);
    color: sys-var(color, text, base);
    overflow-wrap: anywhere;
  }
}
</style>
