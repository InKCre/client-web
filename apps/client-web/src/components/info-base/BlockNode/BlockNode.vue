<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { InkButton, InkLoading } from '@inkcre/ui-web'
import PreviewRenderer from '@/components/info-base/PreviewRenderer/PreviewRenderer.vue'
import type { BlockNodeProps } from './BlockNode'
import { blockNodeEmits } from './BlockNode'

const props = defineProps<BlockNodeProps>()
const emit = defineEmits(blockNodeEmits)
const resolverName = computed(() => props.data.resolver?.constructor.name ?? 'Block')

const onNodeClick = () => {
  emit('focus', props.data.block.id)
}

const inspect = () => emit('inspect', props.data.block.id)
</script>

<template>
  <!-- Handles for edge connections - positioned at all sides for flexible routing -->
  <Handle type="target" :position="Position.Top" class="block-node__handle" />
  <Handle type="target" :position="Position.Left" class="block-node__handle" />
  <Handle type="source" :position="Position.Bottom" class="block-node__handle" />
  <Handle type="source" :position="Position.Right" class="block-node__handle" />

  <div
    class="block-node"
    :class="{
      'block-node--focal': data.focal,
      'block-node--muted': data.muted,
    }"
    @click="onNodeClick"
  >
    <header>
      <span class="block-node__resolver">{{ resolverName }}</span>
      <span class="nodrag nopan block-node__inspect" @pointerdown.stop @click.stop>
        <InkButton
          icon="i-mdi-information-outline"
          theme="subtle"
          type="square"
          size="sm"
          aria-label="Inspect Block"
          @click="inspect"
        />
      </span>
    </header>
    <div class="block-node__content">
      <InkLoading v-if="data.previewStatus === 'loading'" />
      <PreviewRenderer
        v-else-if="data.previewStatus === 'success' && data.resolver"
        :resolver="data.resolver"
        :solved-content="data.solvedContent"
      />
      <span v-else class="block-node__preview-error">Preview unavailable</span>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
