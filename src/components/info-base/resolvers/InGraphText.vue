<script setup lang="ts">
import { computed } from "vue";
import type { InGraphProps } from "@/business/info-base/resolver";

const props = withDefaults(defineProps<InGraphProps<string>>(), {
  isSelected: false,
  maxWidth: 200,
  maxHeight: 150,
});

const displayText = computed(() => {
  const text =
    typeof props.rawContent === "string"
      ? props.rawContent
      : String(props.rawContent);
  const maxLen = 100;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
});
</script>

<template>
  <div
    class="in-graph-text"
    :class="{ 'in-graph-text--selected': isSelected }"
    :style="{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }"
  >
    <div class="in-graph-text__content">{{ displayText }}</div>
  </div>
</template>

<style lang="scss" scoped>
.in-graph-text {
  padding: sys-var(space, sm) sys-var(space, md);
  background: sys-var(color, surface, base);
  min-width: 80px;
  overflow: hidden;

  &--selected {
    box-shadow: 0 0 0 2px sys-var(color, border, primary);
  }

  &__content {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    word-break: break-word;
    line-height: 1.4;
  }
}
</style>
