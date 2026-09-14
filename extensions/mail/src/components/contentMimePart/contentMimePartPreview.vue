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
  display: grid;
  min-width: 0;
  overflow-wrap: anywhere;
  gap: sys-var(space, xs);
  max-width: 320px;

  strong {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    @include apply-font(label-lg);
  }

  span {
    @include apply-font(label-md);
    color: var(--sys-color-text-subtle);
  }
}
</style>
