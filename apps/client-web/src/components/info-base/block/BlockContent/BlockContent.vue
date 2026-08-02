<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Resolver } from '@inkcre/core'
import type { Block, ResolverContentState } from '@inkcre/core'
import { InkLoading } from '@inkcre/ui-web'

const props = defineProps<{
  block: Block
}>()

// --- data ---
const solvedContent = ref<any>(null)
const setupError = ref<Error | null>(null)
let resolverCls: ReturnType<typeof Resolver.getClass> | null = null
let resolver: Resolver | null = null
try {
  resolverCls = Resolver.getClass(props.block.resolver)
  resolver = new resolverCls(props.block)
} catch (error) {
  setupError.value = error instanceof Error ? error : new Error(String(error))
}

// --- computed ---
const idleState: ResolverContentState = { status: 'idle', error: null }
const state = computed(() => resolver?.solvedContentState.value ?? idleState)
const isLoading = computed(() => state.value.status === 'loading')
const isError = computed(() => setupError.value !== null || state.value.status === 'error')
const isIdle = computed(() => setupError.value === null && state.value.status === 'idle')

onMounted(async () => {
  if (!resolver) return
  try {
    solvedContent.value = await resolver.getSolvedContent()
  } catch {
    // Resolver state owns the user-facing error.
  }
})

onUnmounted(async () => {
  await resolver?.dispose()
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
        {{ setupError?.message || state.error?.message || 'Failed to load content' }}
      </span>
    </div>

    <!-- Success State - Render actual content component -->
    <component
      v-else-if="solvedContent !== null && resolverCls && resolver"
      :is="resolverCls.contentComp"
      :solved-content="solvedContent"
      :resolver="resolver"
    />

    <!-- Fallback for unknown state -->
    <div v-else class="block-content__fallback">Content unavailable</div>
  </div>
</template>

<style lang="scss" scoped src="./BlockContent.scss" />
