<script setup lang="ts">
import { ref } from 'vue'
import { InkButton } from '@inkcre/ui-web'
import type { SolvedContentRendererProps } from '@inkcre/core'

import type { MailMimePartResolver } from '../../resolver'
import type { SolvedMimePart } from '../../schema'

const props = defineProps<SolvedContentRendererProps<SolvedMimePart, MailMimePartResolver>>()
const content = ref(props.solvedContent)
const loading = ref(false)
const error = ref<Error | null>(null)

async function materialize(): Promise<void> {
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
  <div class="content-mime-part">
    <strong>{{
      content.root.filename || content.root.description || content.root.media_type
    }}</strong>
    <span>{{ content.root.media_type }}</span>
    <span v-if="content.root.encoded_size !== null"
      >{{ content.root.encoded_size }} bytes encoded</span
    >
    <a
      v-if="
        content.content &&
        typeof content.content.solvedContent === 'object' &&
        content.content.solvedContent &&
        'objectUrl' in content.content.solvedContent
      "
      :href="String(content.content.solvedContent.objectUrl)"
      target="_blank"
      rel="noopener noreferrer"
      >Open</a
    >
    <InkButton v-else text="Download content" :is-loading="loading" @click="materialize" />
    <p v-if="error" role="alert">{{ error.message }}</p>
  </div>
</template>

<style scoped lang="scss">
.content-mime-part {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  overflow-wrap: anywhere;

  strong {
    @include apply-font(label-lg);
  }

  span {
    @include apply-font(label-md);
    color: var(--sys-color-text-subtle);
  }

  p {
    @include apply-font(body-sm);
    margin: 0;
    color: var(--sys-color-feedback-error);
  }
}
</style>
