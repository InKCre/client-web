<template>
  <div class="relation-viewer">
    <details class="relation-viewer__card" :open="isExpanded">
      <summary class="relation-viewer__header" @click="toggleExpanded">
        <div class="relation-viewer__content">{{ relation.content || 'UNNAMED_RELATION' }}</div>
        <div class="relation-viewer__expand-indicator">
          <span class="relation-viewer__chevron">{{ isExpanded ? '▲' : '▼' }}</span>
        </div>
      </summary>
      <div class="relation-viewer__body">
        <div class="relation-viewer__connection-line"></div>
        <div class="relation-viewer__blocks">
          <template v-if="to">
            <div class="relation-viewer__block-container relation-viewer__block-container--to">
              <slot name="to_block"></slot>
            </div>
          </template>
          <template v-if="from">
            <div class="relation-viewer__block-container relation-viewer__block-container--from">
              <slot name="from_block"></slot>
            </div>
          </template>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import type { Relation } from '../../types/relations'
import type { RelationViewerProps } from './relationViewerTypes'

const props = defineProps<RelationViewerProps>()

// expose simple locals for use in template
const { relation, to, from } = toRefs(props)

const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
@use './relationViewer.scss' as *;
</style>
