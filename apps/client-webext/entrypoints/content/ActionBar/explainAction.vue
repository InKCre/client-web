<template>
  <div class="relative shrink-0 size-5 cursor-pointer" @click="handleExplain">
    <img alt="Explain" class="block max-w-none size-full" :src="explain" />
  </div>
</template>

<script setup lang="ts">
import { sendMessage } from 'webext-bridge/content-script'
import explain from '~/assets/explain.svg'
import { newTask } from '~/logic/task'

function openExplainSidePanel(selectedText: string) {
  const url = window.location.href
  // Open the Explain sidepanel page specifically
  sendMessage('open-sidepanel', { path: '/explain.html' })
  newTask({
    type: 'explain',
    parameters: {
      selectedText,
      url,
    },
  })
}

function handleExplain() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  const selectedText = selection.toString()
  openExplainSidePanel(selectedText)
}
</script>
