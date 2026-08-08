<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Resolver } from '@inkcre/core'
import type { Block } from '@inkcre/core'
import { InkLoading } from '@inkcre/ui-web'

const props = defineProps<{
  block: Block
}>()

// --- data ---
const solvedContent = ref<any>(null)
const resolverCls = Resolver.getClass(props.block.resolver)
const resolver = new resolverCls(props.block)

// --- computed ---
const state = resolver.solvedContentState
const isLoading = computed(() => state.value.status === 'loading')
const isError = computed(() => state.value.status === 'error')
const isIdle = computed(() => state.value.status === 'idle')

onMounted(async () => {
  solvedContent.value = await resolver.getSolvedContent()
})

onUnmounted(async () => {
  await resolver.dispose()
})
</script>

<template>
  <div
    class="block-content"
    :class="{
      'block-content--loading': isLoading,
      'block-content--error': isError,
    }"
  >
    <!-- Loading State -->
    <div v-if="isLoading || isIdle" class="block-content__loading">
      <ink-loading size="sm" />
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="block-content__error">
      <span class="block-content__error-icon">!</span>
      <span class="block-content__error-text">
        {{ state.error?.message || 'Failed to load content' }}
      </span>
    </div>

    <!-- Success State - Render actual content component -->
    <component
      v-else-if="solvedContent"
      :is="resolverCls.contentComp"
      :solvedContent="solvedContent"
    />

    <!-- Fallback for unknown state -->
    <div v-else class="block-content__fallback">
      {{ block.content }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockContent.scss" />
