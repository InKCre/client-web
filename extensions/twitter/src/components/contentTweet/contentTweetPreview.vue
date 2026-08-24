<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

import type { Tweet } from '../../schema'

const props = defineProps<SolvedContentRendererProps<Tweet>>()
const text = computed(() => {
  const plain = props.solvedContent.text
    .replace(/\[(?:photo|video|link)\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain
})
</script>

<template>
  <article class="tweet-preview">
    <span>@{{ solvedContent.user_id ?? 'unknown' }}</span>
    <p>{{ text }}</p>
    <img v-if="solvedContent.attachments?.[0]" :src="solvedContent.attachments[0]" alt="" />
  </article>
</template>

<style scoped lang="scss">
.tweet-preview {
  display: grid;
  gap: 8px;
  min-width: 180px;
  max-width: 340px;

  span {
    color: var(--ink-text-secondary, #6b7280);
    font-size: 0.75rem;
  }

  p {
    margin: 0;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  img {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
  }
}
</style>
