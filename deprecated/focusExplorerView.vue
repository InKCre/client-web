<template>
  <FocusExplorer class="focus-explorer-view" :block-id="blockId" @update:block-id="onBlockIdUpdate" />
</template>

<script setup lang="ts">
import FocusExplorer from '../../deprecated/focusExplorer/focusExplorer.vue'
import router from '@/router'

// Props
interface Props {
  blockId: number
}
const props = defineProps<Props>()

function onBlockIdUpdate(blockId: number) {
  // 跳转到 /focus/blockId
  router.replace(`/focus/${blockId}`)
}
</script>

<style lang="scss" scoped>
.focus-explorer-view {
  margin: var(--space-lg) var(--space-xl) 0 var(--space-xl);
  width: auto;
}
</style>
