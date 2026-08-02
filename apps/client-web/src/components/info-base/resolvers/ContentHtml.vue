<script setup lang="ts">
import { computed } from 'vue'
import type { ContentCompProps } from '@inkcre/core'
const props = defineProps<ContentCompProps<string>>()

const displayContent = computed(() => {
  const textContent = stripHtml(props.solvedContent)
  const maxLen = 80
  const preview = textContent.length > maxLen ? textContent.slice(0, maxLen) + '...' : textContent

  return preview || '[HTML]'
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
    <div class="content-html__preview">{{ displayContent }}</div>
  </div>
</template>

<style lang="scss" scoped>
.content-html {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

  &__badge {
    @include apply-font(label-sm, true);
    color: sys-var(color, text, subtle);
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  &__title {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    font-weight: 500;
    word-break: break-word;
  }

  &__preview {
    @include apply-font(label-lg);
    color: sys-var(color, text, subtle);
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
