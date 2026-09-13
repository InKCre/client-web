<script setup lang="ts">
import type { SolvedContentRendererProps } from '@inkcre/core'

import type { MailMimePartResolver } from '../../resolver'
import type { SolvedMimePart } from '../../schema'

defineProps<SolvedContentRendererProps<SolvedMimePart, MailMimePartResolver>>()
</script>

<template>
  <div class="mime-part-preview">
    <strong>{{
      solvedContent.root.filename || solvedContent.root.description || solvedContent.root.media_type
    }}</strong>
    <span>{{ solvedContent.root.media_type }}</span>
  </div>
</template>

<style scoped lang="scss">
.mime-part-preview {
  display: flex;
  flex-wrap: wrap;
  overflow-wrap: anywhere;
  justify-content: space-between;
  gap: 12px;
  max-width: 320px;

  strong {
    @include apply-font(label-lg);
  }

  span {
    @include apply-font(label-md);
    color: var(--sys-color-text-subtle);
  }
}
</style>
