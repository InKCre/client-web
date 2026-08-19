<script setup lang="ts">
import { computed } from 'vue'
import { BezierEdge, EdgeLabelRenderer, getBezierPath, MarkerType } from '@vue-flow/core'
import type { RelationEdgeEmits, RelationEdgeProps } from './RelationEdge'

const props = defineProps<RelationEdgeProps>()
const emit = defineEmits<RelationEdgeEmits>()

const label = computed(() => props.data?.relation?.content ?? '')
const curvature = computed(() => 0.16 + ((props.data?.relation.id ?? 0) % 5) * 0.035)

const path = computed(() => {
  return getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: curvature.value,
  })
})

const edgePath = computed(() => path.value[0])
const labelX = computed(() => path.value[1])
const labelY = computed(() => path.value[2])
</script>

<template>
  <BezierEdge
    :id="id"
    :source-x="sourceX"
    :source-y="sourceY"
    :target-x="targetX"
    :target-y="targetY"
    :source-position="sourcePosition"
    :target-position="targetPosition"
    :marker-end="markerEnd"
    :class="{
      'relation-edge': true,
      'relation-edge--focal': data?.focal,
      'relation-edge--muted': data?.muted,
    }"
  />

  <EdgeLabelRenderer v-if="label">
    <div
      class="relation-edge__label"
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
        aria-label="Inspect Relation"
        @click="emit('inspect', data!.relation.id)"
      >
        <span class="i-mdi-information-outline" aria-hidden="true" />
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<style lang="scss" scoped src="./RelationEdge.scss" />
