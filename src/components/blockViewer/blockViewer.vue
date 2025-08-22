<template>
  <div class="block-viewer" @click="onBlockClick">
    <div class="block-preview">
      <!-- 这里根据 resolver 渲染不同类型的内容 -->
      <div class="content-placeholder">
        <span class="content-icon">◆</span>
        <span class="loading-text">LOADING...</span>
      </div>
    </div>
    <div class="block-footer">
      <span class="block-id">#{{ props.blockId }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlockViewerProps } from './blockViewerTypes'
const props = defineProps<BlockViewerProps>()
const emit = defineEmits<{
  (e: 'click', id: number): void
}>()

function onBlockClick() {
  emit('click', props.blockId)
}
</script>

<style lang="scss" scoped>
@use './blockViewer.scss' as *;
</style>
