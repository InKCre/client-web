<script setup lang="ts">
import { computed } from 'vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

const props = defineProps<SolvedContentRendererProps<Record<string, unknown>>>()
const title = computed(
  () => props.solvedContent.address || props.solvedContent.name || 'Mail record'
)
const details = computed(() =>
  Object.entries(props.solvedContent).filter(
    ([key, value]) =>
      !['address', 'name', 'description'].includes(key) &&
      value !== null &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0)
  )
)
</script>

<template>
  <article class="mail-fact">
    <strong>{{ title }}</strong>
    <p v-if="solvedContent.description">{{ solvedContent.description }}</p>
    <dl v-if="details.length">
      <template v-for="[name, value] in details" :key="name">
        <dt>{{ name.replace(/_/g, ' ') }}</dt>
        <dd>{{ Array.isArray(value) ? value.join(', ') : value }}</dd>
      </template>
    </dl>
  </article>
</template>

<style scoped lang="scss">
.mail-fact {
  display: grid;
  gap: sys-var(space, sm);
  min-width: 0;
  overflow-wrap: anywhere;
  color: sys-var(color, text, base);
  strong {
    @include apply-font(label-lg);
  }
  p {
    margin: 0;
    @include apply-font(body-md);
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
