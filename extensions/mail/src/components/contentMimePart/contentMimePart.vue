<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MimePartItem from './MimePartItem.vue'
import type { SolvedContentRendererProps } from '@inkcre/core'

import type { MailMimePartResolver } from '../../resolver'
import type { SolvedMimePart } from '../../schema'

const props = defineProps<SolvedContentRendererProps<SolvedMimePart, MailMimePartResolver>>()
const content = ref(props.solvedContent)
const loading = ref(false)
const error = ref<Error | null>(null)

const details = computed(() =>
  Object.entries(content.value.root).filter(
    ([key, value]) =>
      !['filename', 'media_type', 'encoded_size'].includes(key) && value !== null && value !== ''
  )
)
watch(
  () => props.solvedContent,
  (value) => {
    content.value = value
    error.value = null
  }
)

async function materialize(): Promise<void> {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    content.value = await props.resolver.getSolvedContent({
      refresh: true,
      materializeMissing: true,
    })
  } catch (cause) {
    error.value = cause instanceof Error ? cause : new Error(String(cause))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <article class="content-mime-part">
    <MimePartItem
      :content="content"
      :loading="loading"
      :error="error?.message"
      @download="materialize"
    />
    <details v-if="details.length">
      <summary>File details</summary>
      <dl>
        <template v-for="[key, value] in details" :key="key"
          ><dt>{{ key.replace(/_/g, ' ') }}</dt>
          <dd>{{ value }}</dd></template
        >
      </dl>
    </details>
  </article>
</template>

<style scoped lang="scss">
.content-mime-part {
  display: grid;
  gap: sys-var(space, lg);
  min-width: 0;
  overflow-wrap: anywhere;
  color: sys-var(color, text, base);
  summary {
    @include apply-font(body-sm);
    cursor: pointer;
    color: sys-var(color, text, subtle);
  }
  dl {
    display: grid;
    grid-template-columns: fit-content(35%) minmax(0, 1fr);
    gap: sys-var(space, sm) sys-var(space, md);
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
