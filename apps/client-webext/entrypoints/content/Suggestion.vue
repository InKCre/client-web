<template>
  <div
    class="suggestion relative p-2 border border-border bg-surface hover:bg-surface-2 transition-colors cursor-pointer flex flex-col gap-y1"
    @mouseover="isHovered = true"
    @mouseleave="isHovered = false"
    @click="applySuggestion"
  >
    <div class="original text-muted text-sm">{{ original }}</div>
    <div class="replacement text-text font-medium text-sm">
      {{ replacement }}
    </div>
    <button
      v-show="isHovered"
      class="copy-btn"
      @click.stop="copyToClipboard"
      title="复制替换内容"
    >
      <i class="i-carbon-copy"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  original: string;
  replacement: string;
}>();

const emit = defineEmits<{
  apply: [text: string];
  copied: [];
}>();

const isHovered = ref(false);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.replacement);
    emit("copied");
  } catch (err) {
    console.error("复制失败:", err);
  }
};

const applySuggestion = () => {
  emit("apply", props.replacement);
};
</script>

