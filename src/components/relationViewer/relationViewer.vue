<template>
  <div class="relation-viewer">
    <details class="relation-card" :open="isExpanded">
      <summary class="relation-header" @click="toggleExpanded">
        <div class="relation-content">{{ relation.content || 'UNNAMED_RELATION' }}</div>
        <div class="expand-indicator">
          <span class="chevron">{{ isExpanded ? '▲' : '▼' }}</span>
        </div>
      </summary>
      <div class="relation-body">
        <div class="connection-line"></div>
        <div class="relation-blocks">
          <template v-if="to">
            <div class="block-container to">
              <slot name="to_block"></slot>
            </div>
          </template>
          <template v-if="from">
            <div class="block-container from">
              <slot name="from_block"></slot>
            </div>
          </template>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Relation } from '../../types/relations'
import type { RelationViewerProps } from './relationViewerTypes'

const props = defineProps<RelationViewerProps>()

const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<style lang="scss" scoped>
@use './relationViewer.scss' as *;
</style>
