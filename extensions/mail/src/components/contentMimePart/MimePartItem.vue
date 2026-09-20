<script setup lang="ts">
import { computed } from 'vue'
import { InkButton } from '@inkcre/ui-web'
import type { SolvedMimePart } from '../../schema'

const props = defineProps<{ content: SolvedMimePart; loading: boolean; error?: string }>()
defineEmits<{ download: [] }>()
const url = computed(() => {
  const value = props.content.content?.solvedContent
  return value &&
    typeof value === 'object' &&
    'objectUrl' in value &&
    typeof value.objectUrl === 'string'
    ? value.objectUrl
    : null
})
</script>

<template>
  <div class="mime-part-item" :aria-busy="loading">
    <div class="mime-part-item__identity">
      <strong>{{
        content.root.filename || content.root.description || content.root.media_type
      }}</strong>
      <p>
        {{ content.root.media_type
        }}<span v-if="content.root.encoded_size !== null">
          · {{ content.root.encoded_size.toLocaleString() }} encoded bytes</span
        >
      </p>
    </div>
    <a v-if="url" :href="url" target="_blank" rel="noopener noreferrer">Open</a>
    <InkButton
      v-else
      text="Download"
      theme="subtle"
      :is-loading="loading"
      @click="$emit('download')"
    />
    <p v-if="error" class="mime-part-item__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.mime-part-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: sys-var(space, sm) sys-var(space, md);
  min-width: 0;
  overflow-wrap: anywhere;
  color: sys-var(color, text, base);
  &__identity {
    flex: 1 1 12rem;
    min-width: 0;
  }
  strong {
    @include apply-font(label-lg);
  }
  p {
    margin: sys-var(space, xs) 0 0;
    @include apply-font(body-sm);
    color: sys-var(color, text, subtle);
  }
  a {
    @include apply-font(label-md, $underlined: true);
    color: inherit;
  }
  .mime-part-item__error {
    flex-basis: 100%;
    margin: 0;
    color: sys-var(color, feedback, error);
  }
}
</style>
