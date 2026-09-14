<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@vue-flow/core'
import type { RelationEdgeEmits, RelationEdgeProps } from './RelationEdge'

const props = defineProps<RelationEdgeProps>()
const emit = defineEmits<RelationEdgeEmits>()

const label = computed(() => {
  const content = props.data?.relation.content.trim() ?? ''
  return !content || /^[{[]/.test(content) ? `Relation #${props.data?.relation.id}` : content
})

const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.16,
  })
})

const edgePath = computed(() => path.value[0])
const labelX = computed(() => path.value[1])
const labelY = computed(() => path.value[2])
</script>

<template>
  <BaseEdge
    :id="id"
    :path="edgePath"
    :marker-end="markerEnd"
    :class="{
      'relation-edge': true,
      'relation-edge--focal': data?.focal,
      'relation-edge--muted': data?.muted,
    }"
  />

  <EdgeLabelRenderer v-if="label">
    <div
      class="relation-edge__label nodrag nopan"
      :class="{
        'relation-edge__label--focal': data?.focal,
        'relation-edge__label--muted': data?.muted,
      }"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }"
    >
      <button type="button" class="relation-edge__focus" @click="emit('focus', data!.relation.id)">
        {{ label }}
      </button>
      <button
        type="button"
        class="relation-edge__inspect"
        :aria-label="`Inspect Relation #${data?.relation.id}`"
        @click="emit('inspect', data!.relation.id)"
      >
        Details
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<style lang="scss" scoped src="./RelationEdge.scss" />
