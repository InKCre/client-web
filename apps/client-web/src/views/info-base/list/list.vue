<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { InkButton, InkLoading } from '@inkcre/ui-web'
import {
  getInfoBaseRouter,
  LexicalRetrievalManager,
  type LexicalRetrievalMatch,
} from '@inkcre/core'

import router from '@/router'
import BlockInspectorPopup from '@/components/info-base/BlockInspectorPopup/BlockInspectorPopup.vue'
import SolvedContentPopup from '@/components/info-base/SolvedContentPopup/SolvedContentPopup.vue'

const { t } = useI18n()
const route = useRoute()
const infoBaseRouter = getInfoBaseRouter()

const input = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const matches = shallowRef<LexicalRetrievalMatch[]>([])
const error = shallowRef<Error | null>(null)
let generation = 0

const currentInfoBaseRoute = computed(() => infoBaseRouter.current.value)
const routeQuery = computed(() => {
  const value = route.query.q
  return typeof value === 'string' ? value.trim() : ''
})

async function retrieve(query: string): Promise<void> {
  const current = ++generation
  matches.value = []
  error.value = null
  if (!query) {
    status.value = 'idle'
    return
  }
  status.value = 'loading'
  try {
    const result = await LexicalRetrievalManager.retrieve({ query, limit: 20 })
    if (current !== generation) return
    matches.value = result.matches
    status.value = 'success'
  } catch (cause) {
    if (current !== generation) return
    error.value = cause instanceof Error ? cause : new Error(String(cause))
    status.value = 'error'
  }
}

watch(
  routeQuery,
  (query) => {
    input.value = query
    void retrieve(query)
  },
  { immediate: true }
)

function search(): void {
  const query = input.value.trim()
  void router.push({ name: 'InfoBaseListOverview', query: query ? { q: query } : {} })
}

function inspect(match: LexicalRetrievalMatch): void {
  void infoBaseRouter.push({ name: 'block', block: match.block.id })
}

function formatRank(rank: number): string {
  return rank.toFixed(3).replace(/\.?0+$/, '')
}

function refresh(): void {
  void retrieve(routeQuery.value)
}
</script>

<template>
  <main class="info-base-list-view">
    <header class="info-base-list-view__hero">
      <p class="info-base-list-view__eyebrow">{{ t('infoBase.list.eyebrow') }}</p>
      <h1>{{ t('infoBase.list.title') }}</h1>
      <form class="info-base-list-view__search" @submit.prevent="search">
        <input
          v-model="input"
          type="search"
          :aria-label="t('infoBase.list.searchLabel')"
          :placeholder="t('infoBase.list.searchPlaceholder')"
          autocomplete="off"
        />
        <InkButton :text="t('infoBase.list.search')" theme="primary" />
      </form>
    </header>

    <section class="info-base-list-view__results" aria-live="polite">
      <div v-if="status === 'idle'" class="info-base-list-view__state">
        <p>{{ t('infoBase.list.idle') }}</p>
      </div>
      <div v-else-if="status === 'loading'" class="info-base-list-view__state">
        <InkLoading />
      </div>
      <div v-else-if="status === 'error'" class="info-base-list-view__state">
        <p>{{ t('infoBase.list.error') }}</p>
        <small>{{ error?.message }}</small>
        <InkButton :text="t('infoBase.list.retry')" theme="subtle" @click="refresh" />
      </div>
      <div v-else-if="matches.length === 0" class="info-base-list-view__state">
        <p>{{ t('infoBase.list.empty', { query: routeQuery }) }}</p>
      </div>
      <ol v-else class="info-base-list-view__matches">
        <li v-for="match in matches" :key="match.block.id">
          <button type="button" class="info-base-list-view__match" @click="inspect(match)">
            <span class="info-base-list-view__match-heading">
              <strong>{{ match.label }}</strong>
              <span>#{{ match.block.id }}</span>
            </span>
            <span class="info-base-list-view__excerpt">{{ match.excerpt }}</span>
            <span class="info-base-list-view__evidence">
              <code>{{ match.block.resolver }}</code>
              <span>{{ t(`infoBase.list.evidence.${match.evidence}`) }}</span>
              <span>{{ formatRank(match.rank) }}</span>
            </span>
          </button>
        </li>
      </ol>
    </section>

    <BlockInspectorPopup
      v-if="currentInfoBaseRoute?.name === 'block'"
      :block="currentInfoBaseRoute.block"
    />
    <SolvedContentPopup
      v-else-if="currentInfoBaseRoute?.name === 'solved-content'"
      :block="currentInfoBaseRoute.block"
    />
  </main>
</template>

<style lang="scss" scoped src="./list.scss" />
