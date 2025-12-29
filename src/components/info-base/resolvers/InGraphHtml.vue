<script setup lang="ts">
import { computed } from "vue";
import type { InGraphProps } from "@/business/info-base/resolver";
import type { HtmlContent } from "@/business/info-base/storages/http";

const props = withDefaults(defineProps<InGraphProps<string | HtmlContent>>(), {
  isSelected: false,
  maxWidth: 200,
  maxHeight: 150,
});

const displayContent = computed(() => {
  let html: string;
  let title: string | undefined;

  if (typeof props.rawContent === "string") {
    html = props.rawContent;
  } else {
    const content = props.rawContent as HtmlContent;
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
  // Basic HTML stripping for preview
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
</script>

<template>
  <div
    class="in-graph-html"
    :class="{ 'in-graph-html--selected': isSelected }"
    :style="{ maxWidth: `${maxWidth}px` }"
  >
    <div class="in-graph-html__badge">HTML</div>
    <div
      v-if="displayContent.type === 'title'"
      class="in-graph-html__title"
    >
      {{ displayContent.text }}
    </div>
    <div v-else class="in-graph-html__preview">
      {{ displayContent.text }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.in-graph-html {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;

  &--selected {
    box-shadow: 0 0 0 2px sys-var(color, border, primary);
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
