<script setup lang="ts">
import { computed, watch, onMounted, ref } from "vue";
import type { Block } from "@/business/info-base/block";
import { resolverManager } from "@/business/info-base/resolver";
import { InkLoading } from "@inkcre/web-design";

const props = defineProps<{
  block: Block;
}>();

// --- data ---
const solvedContent = ref<any>(null);

// --- computed ---
const resolver = computed(
  () => new (resolverManager.getClass(props.block.resolver))(props.block)
);
const state = resolver.value.solvedContentState;
const isLoading = computed(() => state.value.status === "loading");
const isError = computed(() => state.value.status === "error");
const isIdle = computed(() => state.value.status === "idle");

onMounted(async () => {
  solvedContent.value = await resolver.value.getSolvedContent();
});
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
        {{ state.error?.message || "Failed to load content" }}
      </span>
    </div>

    <!-- Success State - Render actual content component -->
    <component
      v-else-if="solvedContent"
      :is="resolver.contentComp"
      :solvedContent="solvedContent"
    />

    <!-- Fallback for unknown state -->
    <div v-else class="block-content__fallback">
      {{ block.content }}
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockContent.scss" />
