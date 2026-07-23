<script setup lang="ts">
import { onNewTask } from '@/logic/task'
import { ref, watch } from 'vue'
import { onMessage } from 'webext-bridge/popup'
import type ArcsEditor from '~/components/info-base/ArcsEditor/ArcsEditor.vue'
import BlockEditor from '~/components/info-base/block/editor.vue'
import { BlockForm } from '~/logic/info-base/block'
import { ArcForm, StarGraphForm } from '~/logic/info-base/root'

const props = defineProps<{
  // 所在网页
  url?: string
}>()

const selectedText = ref('')
const form = ref(
  new StarGraphForm(
    new BlockForm({
      created_at: undefined,
      updated_at: undefined,
      storage: null,
      resolver: 'text',
      content: '',
    })
  )
)
const isFlashing = ref(false)

const incomingEditor = ref<typeof ArcsEditor>()
const outgoingEditor = ref<typeof ArcsEditor>()

watch(selectedText, (newText) => {
  if (newText) {
    form.value.block.content = newText
    isFlashing.value = true
    setTimeout(() => {
      isFlashing.value = false
    }, 500)
  }
})

// watch props.url, update the webpage block
watch(
  () => props.url,
  (newUrl) => {
    if (newUrl) {
      const webpageArcIndex = form.value.in_relations.findIndex(
        (arc) => arc.relation.content === '节选'
      )

      if (webpageArcIndex !== -1) {
        // Update existing webpage block
        const webpageBlock = form.value.in_relations[webpageArcIndex].from_block?.block
        if (webpageBlock) {
          webpageBlock.content = newUrl
        }
      } else {
        // Add new webpage block
        form.value.in_relations.push(
          new ArcForm(
            { content: '节选' },
            null,
            new StarGraphForm(
              new BlockForm({
                created_at: undefined,
                updated_at: undefined,
                storage: null,
                resolver: 'url',
                content: newUrl,
              })
            )
          )
        )
      }
    }
  }
)

function handleKeydown(event: KeyboardEvent) {
  if (!event.altKey) {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault()
      incomingEditor.value?.addArc()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      outgoingEditor.value?.addArc()
    }
  }
}

function submitText() {
  // 发送请求
  form.value
    .create()
    .then((response) => response.json())
    .then((data) => {
      console.log('Success:', data)
      // 处理成功响应
    })
    .catch((error) => {
      console.error('Error:', error)
      // 处理错误
    })
}

onNewTask('taking-note', (task) => {
  selectedText.value = task.parameters.text || ''
})
</script>

<template>
  <main class="taking-note-container" @keydown="handleKeydown" tabindex="0">
    <div class="taking-note-content">
      <!-- 第一行：入向关系及其 from block 编辑器 -->
      <ArcsEditor
        ref="incomingEditor"
        v-model="form.in_relations"
        type="incoming"
        relationType="y"
      />

      <!-- 第二行：主块编辑器 -->
      <BlockEditor
        v-model="form.block"
        placeholder="主块内容..."
        height="h-32"
        border-color="border-gray-300"
        :class="{ 'flash-border': isFlashing }"
        class="main-block-editor"
      />

      <!-- 第三行：出向关系及其 to block 编辑器 -->
      <ArcsEditor
        ref="outgoingEditor"
        v-model="form.out_relations"
        type="outgoing"
        relationType="y"
      />

      <button @click="submitText" class="submit-button">Submit</button>
    </div>
  </main>
</template>

<style scoped lang="scss" src="./TakingNote.scss"></style>
