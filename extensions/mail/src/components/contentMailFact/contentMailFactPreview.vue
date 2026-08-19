<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

const props = defineProps<SolvedContentRendererProps<Record<string, unknown>>>()
const summary = computed(() =>
  Object.entries(props.solvedContent)
    .filter(([, value]) => value !== null && value !== '')
    .slice(0, 3)
)
</script>

<template>
  <dl class="mail-fact-preview">
    <template v-for="[name, value] in summary" :key="name">
      <dt>{{ name.replace(/_/g, ' ') }}</dt>
      <dd>{{ Array.isArray(value) ? value.join(', ') : value }}</dd>
    </template>
  </dl>
</template>

<style scoped lang="scss">
.mail-fact-preview {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 12px;
  margin: 0;
  max-width: 320px;

  dt {
    color: var(--ink-text-secondary, #6b7280);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
}
</style>
