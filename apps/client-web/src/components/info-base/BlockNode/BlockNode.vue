<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { InkLoading } from '@inkcre/ui-web'
import PreviewRenderer from '@/components/info-base/PreviewRenderer/PreviewRenderer.vue'
import type { BlockNodeProps } from './BlockNode'
import { blockNodeEmits } from './BlockNode'

const props = defineProps<BlockNodeProps>()
const emit = defineEmits(blockNodeEmits)

const onNodeClick = () => {
  emit('focus', props.data.block.id)
}

const inspect = () => emit('inspect', props.data.block.id)
</script>

<template>
  <template
    v-for="position in [Position.Top, Position.Right, Position.Bottom, Position.Left]"
    :key="position"
  >
    <Handle
      :id="`target-${position}`"
      type="target"
      :position="position"
      class="block-node__handle"
    />
    <Handle
      :id="`source-${position}`"
      type="source"
      :position="position"
      class="block-node__handle"
    />
  </template>

  <div
    class="block-node"
    :class="{
      'block-node--focal': data.focal,
      'block-node--muted': data.muted,
    }"
  >
    <div
      class="block-node__content nodrag nopan"
      role="button"
      tabindex="0"
      :aria-label="`Explore Block #${data.block.id}`"
      @click="onNodeClick"
      @keydown.enter.prevent="onNodeClick"
      @keydown.space.prevent="onNodeClick"
    >
      <InkLoading v-if="data.previewStatus === 'loading'" />
      <PreviewRenderer
        v-else-if="data.previewStatus === 'success' && data.resolver"
        :resolver="data.resolver"
        :solved-content="data.solvedContent"
      />
      <span v-else class="block-node__preview-error">Preview unavailable</span>
    </div>
    <footer>
      <span class="block-node__identity">#{{ data.block.id }}</span>
      <button
        type="button"
        class="block-node__inspect nodrag nopan"
        :aria-label="`Inspect Block #${data.block.id}`"
        @click="inspect"
      >
        Details
      </button>
    </footer>
  </div>
</template>

<style lang="scss" scoped src="./BlockNode.scss" />
