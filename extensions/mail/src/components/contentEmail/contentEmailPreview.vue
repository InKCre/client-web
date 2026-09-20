<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

import type { EmailResolver } from '../../resolver'
import type { SolvedEmail } from '../../schema'

const props = defineProps<SolvedContentRendererProps<SolvedEmail, EmailResolver>>()
const sender = computed(() => {
  const participant = props.solvedContent.participants.find((item) => item.relation.role === 'from')
  return participant?.relation.display_name || participant?.address.solvedContent.address || null
})
const body = computed(() => {
  const text = props.solvedContent.bodies.find(
    (item) => item.block.resolver === 'core.text.v1'
  )?.solvedContent
  if (typeof text !== 'string') return null
  const plain = text.replace(/\s+/g, ' ').trim()
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain
})
</script>

<template>
  <article class="email-preview">
    <strong>{{ solvedContent.root.subject || '(no subject)' }}</strong>
    <span v-if="sender">{{ sender }}</span>
    <p v-if="body">{{ body }}</p>
  </article>
</template>

<style scoped lang="scss">
.email-preview {
  display: grid;
  gap: sys-var(space, xs);
  min-width: 0;
  max-width: 360px;

  overflow-wrap: anywhere;

  strong {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    @include apply-font(label-lg);
  }

  span {
    @include apply-font(label-md);
  }

  span,
  p {
    margin: 0;
    color: var(--sys-color-text-subtle);
  }

  p {
    @include apply-font(body-sm);
    overflow-wrap: anywhere;
  }
}
</style>
