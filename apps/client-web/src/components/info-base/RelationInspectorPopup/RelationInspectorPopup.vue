<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { InkButton, InkLoading, InkPopup } from '@inkcre/ui-web'
import { getInfoBaseRouter, Relation } from '@inkcre/core'

import type { RelationInspectorPopupProps } from './RelationInspectorPopup'

const props = defineProps<RelationInspectorPopupProps>()
const router = getInfoBaseRouter()
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
  <InkPopup :open="true" :scrim="false" position="right" @update:open="close">
    <section class="relation-inspector-popup">
      <header>
        <h3>Relation #{{ props.relation }}</h3>
        <InkButton icon="i-mdi-close" theme="subtle" type="square" @click="close" />
      </header>
      <InkLoading v-if="status === 'loading'" />
      <p v-else-if="status === 'missing'">This Relation no longer exists.</p>
      <p v-else-if="status === 'error'">Unable to load this Relation.</p>
      <dl v-else-if="relation">
        <dt>From</dt>
        <dd>#{{ relation.from_ }}</dd>
        <dt>Property</dt>
        <dd>{{ relation.content }}</dd>
        <dt>To</dt>
        <dd>#{{ relation.to_ }}</dd>
      </dl>
    </section>
  </InkPopup>
</template>

<style scoped lang="scss">
.relation-inspector-popup {
  width: min(360px, calc(100vw - 32px));

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
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px 16px;
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
