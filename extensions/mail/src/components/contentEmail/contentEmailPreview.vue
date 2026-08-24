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
    <span v-if="sender">{{ sender }}</span>
    <strong>{{ solvedContent.root.subject || '(no subject)' }}</strong>
    <p v-if="body">{{ body }}</p>
  </article>
</template>

<style scoped lang="scss">
.email-preview {
  display: grid;
  gap: 6px;
  min-width: 220px;
  max-width: 360px;

  span,
  p {
    margin: 0;
    color: var(--ink-text-secondary, #6b7280);
  }

  p {
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
}
</style>
