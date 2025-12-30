<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import { storageManager } from "@/business/info-base/storage";

const props = withDefaults(defineProps<ContentCompProps>(), {
  isSelected: false,
  maxWidth: 200,
  maxHeight: 150,
});

const content = ref<string>("");
const isLoading = ref(true);
const error = ref<Error | null>(null);

const displayText = computed(() => {
  const text = content.value || props.resolver.block.content;
  const maxLen = 100;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
});

onMounted(async () => {
  try {
    const rawContent = await storageManager.getRawContent(props.resolver.block);
    content.value = typeof rawContent === "string" ? rawContent : String(rawContent);
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e));
    content.value = props.resolver.block.content;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="content-text"
    :class="{ 'content-text--selected': isSelected }"
    :style="{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }"
  >
    <div v-if="isLoading" class="content-text__loading">...</div>
    <div v-else class="content-text__content">{{ displayText }}</div>
  </div>
</template>

<style lang="scss" scoped>
.content-text {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

  &--selected {
    box-shadow: 0 0 0 2px sys-var(color, border, primary);
  }

  &__loading {
    @include apply-font(label-lg);
    color: sys-var(color, text, subtle);
  }

  &__content {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
