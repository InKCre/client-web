<template>
  <div class="block-viewer" @click="onBlockClick">
    <div class="block-viewer__preview">
      <!-- 这里根据 resolver 渲染不同类型的内容 -->
      <div class="block-viewer__content-placeholder">
        <span class="block-viewer__content-icon">◆</span>
        <span class="block-viewer__loading-text">LOADING...</span>
      </div>
    </div>
    <div class="block-viewer__footer">
      <span class="block-viewer__id">#{{ $props.blockId }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlockViewerProps } from './blockViewerTypes'

const props = defineProps<BlockViewerProps>()
const emit = defineEmits()

function onBlockClick() {
  emit('click', props.blockId)
}
</script>

<style lang="scss" scoped>
@use './blockViewer.scss' as *;
</style>
