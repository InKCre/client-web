<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { InkButton, InkLoading, InkPopup } from '@inkcre/ui-web'
import { LexicalRetrievalManager, type BlockRef, type LexicalRetrievalMatch } from '@inkcre/core'

import router from '@/router'
import { closeRecallSearch, openRecallSearch, recallSearchOpen } from './recall-search'

const route = useRoute()
const open = computed({
  get: () => recallSearchOpen.value,
  set: (value: boolean) => (value ? openRecallSearch() : closeRecallSearch()),
})
const query = ref('')
const mode = ref<'recall' | 'path'>('recall')
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const matches = shallowRef<LexicalRetrievalMatch[]>([])
const selected = ref<BlockRef[]>([])
const error = shallowRef<Error | null>(null)
let generation = 0

const isGraphActive = computed(() => String(route.name ?? '').startsWith('InfoBaseGraph'))

function onShortcut(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openRecallSearch()
  }
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onUnmounted(() => window.removeEventListener('keydown', onShortcut))

async function search(): Promise<void> {
  const value = query.value.trim()
  if (!value) return
  const current = ++generation
  status.value = 'loading'
  matches.value = []
  error.value = null
  try {
    const result = await LexicalRetrievalManager.retrieve({ query: value, limit: 20 })
    if (current !== generation) return
    matches.value = result.matches
    status.value = 'ready'
    if (mode.value === 'recall') {
      await router.push({
        name: isGraphActive.value ? 'InfoBaseGraphOverview' : 'InfoBaseListOverview',
        query: { q: value },
      })
      closeRecallSearch()
    }
  } catch (cause) {
    if (current !== generation) return
    error.value = cause instanceof Error ? cause : new Error(String(cause))
    status.value = 'error'
  }
}

async function choosePathBlock(block: BlockRef): Promise<void> {
  if (selected.value.includes(block)) return
  selected.value = [...selected.value, block].slice(0, 2)
  if (selected.value.length < 2) return
  await router.push({
    name: 'InfoBaseGraphOverview',
    query: { path_from: String(selected.value[0]), path_to: String(selected.value[1]) },
  })
  closeRecallSearch()
  selected.value = []
}

function setMode(value: 'recall' | 'path'): void {
  mode.value = value
  selected.value = []
  matches.value = []
  status.value = 'idle'
}
</script>

<template>
  <InkPopup v-model:open="open" position="top">
    <section class="recall-search" aria-label="Recall information">
      <header>
        <div class="recall-search__modes">
          <button type="button" :aria-pressed="mode === 'recall'" @click="setMode('recall')">
            Recall
          </button>
          <button type="button" :aria-pressed="mode === 'path'" @click="setMode('path')">
            Find path
          </button>
        </div>
        <small>Ctrl K</small>
      </header>
      <form @submit.prevent="search">
        <input
          v-model="query"
          type="search"
          autofocus
          autocomplete="off"
          :placeholder="mode === 'path' ? 'Find path endpoints' : 'Recall a clue'"
        />
        <InkButton text="Search" theme="primary" />
      </form>
      <div v-if="mode === 'path'" class="recall-search__results" aria-live="polite">
        <InkLoading v-if="status === 'loading'" />
        <p v-else-if="status === 'error'">{{ error?.message }}</p>
        <p v-else-if="selected.length === 1">Choose the destination Block.</p>
        <button
          v-for="match in matches"
          :key="match.block.id"
          type="button"
          :disabled="selected.includes(match.block.id)"
          @click="choosePathBlock(match.block.id)"
        >
          <strong>{{ match.label }}</strong>
          <span>{{ match.excerpt }}</span>
        </button>
      </div>
    </section>
  </InkPopup>
</template>

<style scoped lang="scss">
.recall-search {
  width: min(640px, calc(100vw - 32px));

  header,
  form {
    display: flex;
    align-items: center;
    gap: sys-var(space, sm);
  }

  header {
    justify-content: space-between;
    margin-bottom: sys-var(space, sm);
  }
  small {
    color: sys-var(color, text, subtle);
  }
  form input {
    flex: 1;
    min-width: 0;
    padding: sys-var(space, sm) sys-var(space, md);
    border: 1px solid sys-var(color, border, subtle);
    color: sys-var(color, text, base);
    background: sys-var(color, surface, base);
    @include apply-font(body-md);
  }
  form input:focus {
    outline: 1px solid sys-var(color, border, primary);
  }

  &__modes {
    display: flex;
    gap: 2px;
    button {
      border: 0;
      padding: 4px 8px;
      color: sys-var(color, text, subtle);
      background: transparent;
      cursor: pointer;
    }
    button[aria-pressed='true'] {
      color: sys-var(color, text, base);
      background: sys-var(color, surface, subtle);
    }
  }

  &__results {
    display: grid;
    gap: 1px;
    max-height: 50vh;
    margin-top: sys-var(space, sm);
    overflow: auto;
    background: sys-var(color, border, subtle);
    > button {
      display: grid;
      gap: 3px;
      padding: sys-var(space, sm);
      border: 0;
      text-align: left;
      color: sys-var(color, text, base);
      background: sys-var(color, surface, base);
      cursor: pointer;
    }
    > button:hover {
      background: sys-var(color, surface, subtle);
    }
    span {
      color: sys-var(color, text, subtle);
    }
  }
}
</style>
