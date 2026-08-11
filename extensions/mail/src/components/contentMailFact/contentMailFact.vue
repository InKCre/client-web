<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

const props = defineProps<SolvedContentRendererProps<Record<string, unknown>>>()
const entries = computed(() =>
  Object.entries(props.solvedContent).filter(([, value]) => value !== null && value !== '')
)
</script>

<template>
  <dl class="content-mail-fact">
    <template v-for="[name, value] in entries" :key="name">
      <dt>{{ name.replace(/_/g, ' ') }}</dt>
      <dd>{{ Array.isArray(value) ? value.join(', ') : value }}</dd>
    </template>
  </dl>
</template>

<style scoped lang="scss">
.content-mail-fact {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 16px;
  margin: 0;

  dt {
    color: var(--ink-text-secondary, #6b7280);
    text-transform: capitalize;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
}
</style>
