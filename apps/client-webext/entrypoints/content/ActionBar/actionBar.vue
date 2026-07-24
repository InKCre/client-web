<template>
  <div
    v-show="showActionBar"
    class="fixed z-100 box-border flex gap-2 items-start justify-start overflow-clip px-1.5 py-1 rounded-none bg-gray-100 min-w-[60px]"
    :style="{
      left: actionBarPosition.x + 'px',
      top: actionBarPosition.y + 'px',
    }"
  >
    <NoteAction />
    <ExplainAction />
  </div>
</template>

<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { onMounted, onUnmounted, ref } from 'vue'
import { onMessage } from 'webext-bridge/content-script'
import ExplainAction from './explainAction.vue'
import NoteAction from './noteAction.vue'

const [showActionBar, toggleActionBar] = useToggle(false)
const actionBarPosition = ref({ x: 0, y: 0 })
const lastSelectionText = ref('')
let resizeObserver: ResizeObserver | null = null

const calculatePositionFromSelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  try {
    const range = selection.getRangeAt(0)
    const rects = range.getClientRects()
    if (rects.length === 0) return false

    const lastRect = rects[rects.length - 1]
    actionBarPosition.value = {
      x: lastRect.right + 10,
      y: lastRect.bottom + 10,
    }
    return true
  } catch {
    return false
  }
}

const handleSelection = () => {
  const selection = window.getSelection()
  const currentText = selection ? selection.toString().trim() : ''
  if (currentText && currentText !== lastSelectionText.value) {
    try {
      // Use the bounding client rects for more accurate positioning
      calculatePositionFromSelection()
      toggleActionBar(true)
      lastSelectionText.value = currentText
    } catch {
      // No valid range
      toggleActionBar(false)
      lastSelectionText.value = ''
    }
  }
}

const handleSelectionChange = () => {
  const selection = window.getSelection()
  const currentText = selection ? selection.toString().trim() : ''
  if (!currentText) {
    toggleActionBar(false)
    lastSelectionText.value = ''
  }
}

const recalculatePosition = () => {
  if (showActionBar.value && lastSelectionText.value) {
    calculatePositionFromSelection()
  }
}

onMounted(() => {
  document.addEventListener('mouseup', handleSelection)
  document.addEventListener('selectionchange', handleSelectionChange)

  // Listen for sidepanel open/close events to recalculate position
  onMessage('sidepanel-opened', () => {
    requestAnimationFrame(() => {
      recalculatePosition()
    })
  })

  onMessage('sidepanel-closed', () => {
    requestAnimationFrame(() => {
      recalculatePosition()
    })
  })

  // Listen for layout changes with resize observer
  resizeObserver = new ResizeObserver(() => {
    recalculatePosition()
  })

  resizeObserver.observe(document.documentElement)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleSelection)
  document.removeEventListener('selectionchange', handleSelectionChange)

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>
