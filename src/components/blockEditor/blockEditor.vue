<template>
  <div class="block-editor">
    <div v-if="block" class="editor-container">
      <div class="block-content" contenteditable>{{ block.content }}</div>
      <div class="block-footer" v-if="block">
        <span class="footer-item">#{{ block.id }}</span>
        <span class="footer-item">{{ block.resolver || 'text' }}</span>
        <span class="footer-item">{{ block.storage || 'direct' }}</span>
      </div>
    </div>
    <div v-else class="empty-state">
      <div class="empty-icon">◇</div>
      <span class="empty-text">NO BLOCK SELECTED</span>
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
