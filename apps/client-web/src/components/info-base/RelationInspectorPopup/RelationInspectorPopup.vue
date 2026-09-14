<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { InkButton, InkLoading, InkPopup } from '@inkcre/ui-web'
import { getInfoBaseRouter, Relation } from '@inkcre/core'

import type { RelationInspectorPopupProps } from './RelationInspectorPopup'

const props = defineProps<RelationInspectorPopupProps>()
const router = getInfoBaseRouter()
const { t } = useI18n()
const status = ref<'loading' | 'success' | 'missing' | 'error'>('loading')
const relation = shallowRef<Relation | null>(null)
let generation = 0

watch(
  () => props.relation,
  async (relationRef) => {
    const current = ++generation
    status.value = 'loading'
    relation.value = null
    try {
      const loaded = await Relation.find(relationRef)
      if (current !== generation) return
      relation.value = loaded
      status.value = loaded ? 'success' : 'missing'
    } catch (cause) {
      if (current !== generation) return
      console.error('[InfoBase] Failed to inspect Relation.', cause)
      status.value = 'error'
    }
  },
  { immediate: true }
)

function close(): void {
  void router.back()
}
</script>

<template>
  <InkPopup
    style="width: 360px; max-width: calc(100vw - 2 * var(--sys-space-md))"
    :open="true"
    :scrim="false"
    position="right"
    :aria-label="`Relation #${props.relation}`"
    @update:open="close"
  >
    <section class="relation-inspector-popup">
      <header>
        <h3>Relation #{{ props.relation }}</h3>
        <InkButton
          icon="i-mdi-close"
          :aria-label="t('common.close')"
          theme="subtle"
          type="square"
          @click="close"
        />
      </header>
      <InkLoading v-if="status === 'loading'" />
      <p v-else-if="status === 'missing'">This Relation no longer exists.</p>
      <p v-else-if="status === 'error'">Unable to load this Relation.</p>
      <dl v-else-if="relation">
        <dt>From</dt>
        <dd>
          <button type="button" @click="router.push({ name: 'block', block: relation.from_ })">
            Block #{{ relation.from_ }}
          </button>
        </dd>
        <dt>Property</dt>
        <dd>{{ relation.content }}</dd>
        <dt>To</dt>
        <dd>
          <button type="button" @click="router.push({ name: 'block', block: relation.to_ })">
            Block #{{ relation.to_ }}
          </button>
        </dd>
      </dl>
    </section>
  </InkPopup>
</template>

<style scoped lang="scss">
.relation-inspector-popup {
  width: 100%;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: sys-var(space, md);
  }

  h3 {
    margin: 0;
    @include apply-font(title-sm);
  }
  dl {
    display: grid;
    grid-template-columns: fit-content(30%) minmax(0, 1fr);
    gap: 8px 16px;
  }
  button {
    padding: 0;
    border: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid sys-var(color, border, strong);
    outline-offset: 2px;
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  dt {
    color: sys-var(color, text, subtle);
  }
}
</style>
