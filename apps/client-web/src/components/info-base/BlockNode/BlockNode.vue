<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { BlockNodeProps } from './BlockNode'
import { blockNodeEmits } from './BlockNode'

const props = defineProps<BlockNodeProps>()
const emit = defineEmits(blockNodeEmits)

const onNodeClick = () => {
  emit('select', props.data.block.id)
}
</script>

<template>
  <!-- Handles for edge connections - positioned at all sides for flexible routing -->
  <Handle type="target" :position="Position.Top" class="block-node__handle" />
  <Handle type="target" :position="Position.Left" class="block-node__handle" />
  <Handle type="source" :position="Position.Bottom" class="block-node__handle" />
  <Handle type="source" :position="Position.Right" class="block-node__handle" />

  <div class="block-node" :class="{ 'block-node--selected': selected }" @click="onNodeClick">
    <div class="block-node__content">
      <span class="block-node__resolver">{{ props.data.block.resolver }}</span>
      <span class="block-node__preview">{{ props.data.preview }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
