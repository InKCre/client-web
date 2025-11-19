<template>
  <div class="block-editor">
    <div v-if="block" class="block-editor__editor-container">
      <div
        class="block-editor__content"
        contenteditable
        @input="onContentChange"
        @blur="onContentBlur"
        @keydown.meta.s.prevent="saveBlock"
        @keydown.ctrl.s.prevent="saveBlock"
        ref="contentEl"
      >
        {{ localContent }}
      </div>
      <div class="block-editor__footer" v-if="block">
        <span class="block-editor__footer-item">#{{ block.id }}</span>
        <span class="block-editor__footer-item">{{ block.resolver || 'text' }}</span>
        <span class="block-editor__footer-item">{{ block.storage || 'direct' }}</span>
        <span v-if="lastSaved" class="block-editor__footer-item">
          保存于 {{ formatDate(lastSaved) }}
        </span>
      </div>

      <div v-if="error" class="block-editor__error">
        {{ error }}
      </div>
    </div>
    <div v-else class="block-editor__empty-state">
      <div class="block-editor__empty-icon">◇</div>
      <span class="block-editor__empty-text">NO BLOCK SELECTED</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { api } from '@/api'
import type { BlockEditorProps } from './blockEditorTypes'

const props = defineProps<BlockEditorProps>()
const emit = defineEmits<{
  'block-updated': [block: import('@/api').Block]
}>()

// 响应式数据
const contentEl = ref<HTMLElement>()
const localContent = ref('')
const saving = ref(false)
const error = ref<string | null>(null)
const lastSaved = ref<string | null>(null)

// 计算属性
const hasChanges = computed(() => {
  return props.block && localContent.value !== props.block.content
})

// 监听block变化，更新本地内容
watch(
  () => props.block,
  (newBlock) => {
    if (newBlock) {
      localContent.value = newBlock.content
      error.value = null
    } else {
      localContent.value = ''
    }
  },
  { immediate: true },
)

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 事件处理
const onContentChange = (event: Event) => {
  const target = event.target as HTMLElement
  localContent.value = target.textContent || ''
}

const onContentBlur = () => {
  // 可以在失焦时自动保存，或者显示保存提示
}

const saveBlock = async () => {
  if (!props.block || !hasChanges.value) return

  try {
    saving.value = true
    error.value = null

    const updatedBlock = await api.blocks.updateBlock(props.block.id, {
      content: localContent.value,
    })

    lastSaved.value = new Date().toISOString()
    emit('block-updated', updatedBlock)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存失败'
    console.error('保存块失败:', err)
  } finally {
    saving.value = false
  }
}

const discardChanges = () => {
  if (props.block) {
    localContent.value = props.block.content
    error.value = null
    nextTick(() => {
      if (contentEl.value) {
        contentEl.value.textContent = localContent.value
      }
    })
  }
}

// 暴露方法给父组件
defineExpose({
  saveBlock,
  discardChanges,
})
</script>

<style lang="scss" src="./blockEditor.scss" scoped></style>
