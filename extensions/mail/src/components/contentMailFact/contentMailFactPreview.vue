<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

const props = defineProps<SolvedContentRendererProps<Record<string, unknown>>>()
const title = computed(
  () => props.solvedContent.address || props.solvedContent.name || 'Mail record'
)
</script>

<template>
  <article class="mail-fact-preview">
    <strong>{{ title }}</strong>
    <p v-if="solvedContent.description">{{ solvedContent.description }}</p>
  </article>
</template>

<style scoped lang="scss">
.mail-fact-preview {
  display: grid;
  gap: sys-var(space, sm);
  min-width: 0;
  overflow-wrap: anywhere;
  color: sys-var(color, text, base);
  strong {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    @include apply-font(label-lg);
  }
  p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin: 0;
    @include apply-font(body-sm);
    color: sys-var(color, text, subtle);
  }
  dl {
    display: grid;
    grid-template-columns: fit-content(35%) minmax(0, 1fr);
    gap: sys-var(space, sm) sys-var(space, md);
    margin: 0;
  }
  dt {
    @include apply-font(body-sm);
    text-transform: capitalize;
    color: sys-var(color, text, subtle);
  }
  dd {
    margin: 0;
    @include apply-font(body-md);
  }
}
</style>
