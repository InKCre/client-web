<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import type { HtmlContent } from "@/business/info-base/storages/http";
import { storageManager } from "@/business/info-base/storage";

const props = withDefaults(defineProps<ContentCompProps>(), {
  isSelected: false,
  maxWidth: 200,
  maxHeight: 150,
});

const rawContent = ref<string | HtmlContent | null>(null);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const displayContent = computed(() => {
  let html: string;
  let title: string | undefined;

  if (!rawContent.value) {
    html = props.resolver.block.content;
  } else if (typeof rawContent.value === "string") {
    html = rawContent.value;
  } else {
    const content = rawContent.value as HtmlContent;
    html = content.html;
    title = content.title;
  }

  // If we have a title, show that
  if (title) {
    return { type: "title" as const, text: title };
  }

  // Extract text content from HTML for preview
  const textContent = stripHtml(html);
  const maxLen = 80;
  const preview =
    textContent.length > maxLen
      ? textContent.slice(0, maxLen) + "..."
      : textContent;

  return { type: "preview" as const, text: preview || "[HTML]" };
});

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

onMounted(async () => {
  try {
    rawContent.value = await storageManager.getRawContent(props.resolver.block);
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e));
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="content-html"
    :class="{ 'content-html--selected': isSelected }"
    :style="{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }"
  >
    <div v-if="isLoading" class="content-html__loading">...</div>
    <template v-else>
      <div class="content-html__badge">HTML</div>
      <div
        v-if="displayContent.type === 'title'"
        class="content-html__title"
      >
        {{ displayContent.text }}
      </div>
      <div v-else class="content-html__preview">
        {{ displayContent.text }}
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.content-html {
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

  &__badge {
    @include apply-font(label-sm, true);
    color: sys-var(color, text, subtle);
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  }

  &__title {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    font-weight: 500;
    word-break: break-word;
  }

  &__preview {
    @include apply-font(label-lg);
    color: sys-var(color, text, subtle);
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
