<script setup lang="ts">
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAsyncState } from '@vueuse/core'
import SourceCard from '@/components/source/sourceCard/sourceCard.vue'
import CreateSource from '@/components/source/createSource/createSource.vue'
import { InkLoading, InkButton } from '@inkcre/ui-web'
import { Source } from '@inkcre/core'

const { t } = useI18n()
const route = useRoute()
const {
  state: sources,
  execute: refetchSources,
  isLoading,
  error,
} = useAsyncState(() => Source.getAll(), [], {
  resetOnExecute: false,
  // The region renders error and retry; this handled failure must not reach reportError.
  onError: () => undefined,
  onSuccess: () => {
    void nextTick(() => {
      if (!/^#source-\d+$/.test(route.hash)) return
      const row = document.getElementById(route.hash.slice(1))
      row?.scrollIntoView({ block: 'nearest' })
      row?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true })
    })
  },
})
async function onCreateSource(source: Source) {
  sources.value = [source, ...sources.value]
  await nextTick()
  document.getElementById(`source-${source.id}`)?.scrollIntoView({ block: 'nearest' })
}
</script>

<template>
  <main class="sources-view">
    <header class="sources-view__header">
      <h1>{{ t('sidePanel.sources') }}</h1>
      <CreateSource @create="onCreateSource" />
    </header>
    <div v-if="isLoading"><InkLoading />{{ t('common.loading') }}</div>
    <div v-else-if="error" class="sources-view__feedback">
      <p role="alert" class="text-feedback-error">{{ t('source.listFailed') }}</p>
      <InkButton :text="t('source.retry')" theme="subtle" @click="refetchSources()" />
    </div>
    <p v-else-if="!sources.length">{{ t('source.empty') }}</p>
    <div class="sources-view__list">
      <SourceCard
        v-for="source in sources"
        :id="`source-${source.id}`"
        :key="source.id"
        :source="source"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped src="./sources.scss" />
