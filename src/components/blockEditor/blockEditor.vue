<template>
  <div class="block-editor">
    <div v-if="block" class="block-editor__editor-container">
      <div class="block-editor__content" contenteditable>{{ block.content }}</div>
      <div class="block-editor__footer" v-if="block">
        <span class="block-editor__footer-item">#{{ block.id }}</span>
        <span class="block-editor__footer-item">{{ block.resolver || 'text' }}</span>
        <span class="block-editor__footer-item">{{ block.storage || 'direct' }}</span>
      </div>
    </div>
    <div v-else class="block-editor__empty-state">
      <div class="block-editor__empty-icon">◇</div>
      <span class="block-editor__empty-text">NO BLOCK SELECTED</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BlockEditorProps } from './blockEditorTypes'
const props = defineProps<BlockEditorProps>()
</script>

<style lang="scss" scoped>
@use './blockEditor.scss' as *;
</style>
