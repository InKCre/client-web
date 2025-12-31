<script setup lang="ts">
import { computed } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import type { HtmlContent } from "@/business/info-base/storages/http";

type HtmlRawContent = string | HtmlContent;

const props = defineProps<ContentCompProps<HtmlRawContent>>();

const displayContent = computed(() => {
  let html: string;
  let title: string | undefined;

  if (typeof props.solvedContent === "string") {
    html = props.solvedContent;
  } else {
    const content = props.solvedContent as HtmlContent;
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
</script>

<template>
  <div class="content-html">
    <div class="content-html__badge">HTML</div>
    <div v-if="displayContent.type === 'title'" class="content-html__title">
      {{ displayContent.text }}
    </div>
    <div v-else class="content-html__preview">
      {{ displayContent.text }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-html {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

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
