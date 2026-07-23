<script setup lang="ts">
import { ref } from 'vue'
import type BlockEditor from '~/components/info-base/block/editor.vue'
import type RelationEditor from '~/components/info-base/relation/editor.vue'
import type { ArcForm } from '~/logic/info-base/root'

const props = withDefaults(
  defineProps<{
    modelValue: ArcForm
    type: 'incoming' | 'outgoing'
    relationType?: 'x' | 'y'
  }>(),
  { relationType: 'x' }
)

const emit = defineEmits<{
  'update:arc': [value: ArcForm]
}>()

const blockEditorRef = ref<InstanceType<typeof BlockEditor>>()
const relationEditorRef = ref<InstanceType<typeof RelationEditor>>()

function isFocusing() {
  return blockEditorRef.value?.isFocusing() || relationEditorRef.value?.isFocusing() || false
}

function focusBlock(preventScroll: boolean) {
  blockEditorRef.value?.focus(preventScroll)
}

function focusRelation(preventScroll: boolean) {
  relationEditorRef.value?.focus(preventScroll)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.altKey && event.key === 'Shift') {
    if (blockEditorRef.value?.isFocusing()) {
      focusRelation(false)
      event.preventDefault()
    } else if (relationEditorRef.value?.isFocusing()) {
      focusBlock(false)
      event.preventDefault()
    }
  }
}

defineExpose({ isFocusing, focusBlock, focusRelation })
</script>

<template>
  <div class="flex flex-col items-center flex-shrink-0 w-full" @keydown="handleKeydown">
    <template v-if="type === 'incoming'">
      <BlockEditor
        ref="blockEditorRef"
        :model-value="modelValue.from_block!.block"
        placeholder="入向块内容..."
        height="h-20"
        border-color="border-border"
      />
      <div class="w-full">
        <RelationEditor
          ref="relationEditorRef"
          :model-value="modelValue.relation"
          :type="relationType"
        />
      </div>
    </template>
    <template v-else>
      <div class="w-full">
        <RelationEditor
          ref="relationEditorRef"
          :model-value="modelValue.relation"
          :type="relationType"
        />
      </div>
      <BlockEditor
        ref="blockEditorRef"
        :model-value="modelValue.to_block!.block"
        placeholder="出向块内容..."
        height="h-20"
        border-color="border-border"
      />
    </template>
  </div>
</template>
