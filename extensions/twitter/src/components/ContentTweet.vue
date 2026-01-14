<script setup lang="ts">
import { ref, computed } from "vue";
import { type Tweet } from "../schema";
import type { ContentCompProps } from "@inkcre/core";

const props = defineProps<ContentCompProps<Tweet>>();

// Track failed image loads
const failedAttachments = ref<Set<number>>(new Set());

// Display text - truncated for graph view
const displayText = computed(() => {
  if (!props.solvedContent) return "";
  const text = props.solvedContent.text
    .replace(/\[photo\]/g, "")
    .replace(/\[video\]/g, "")
    .replace(/\[link\]/g, "")
    .trim();
  const maxLen = 80;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
});

// Attachments from resolved content (blob URLs)
const attachments = computed(() => {
  return props.solvedContent?.attachments || [];
});

// Limit to max 4 attachments (Twitter-like behavior)
const displayAttachments = computed(() => {
  return attachments.value.slice(0, 4);
});

// Count for dynamic grid class
const attachmentCount = computed(() => {
  return displayAttachments.value.length;
});

// Handle image load errors
const onImageError = (index: number) => {
  failedAttachments.value.add(index);
};

// Check if attachment failed to load
const isAttachmentFailed = (index: number) => {
  return failedAttachments.value.has(index);
};
</script>

<template>
  <div class="content-tweet__header">
    <span class="content-tweet__icon">𝕏</span>
    <span class="content-tweet__user">@{{ props.solvedContent.user_id }}</span>
  </div>
  <div class="content-tweet__text">{{ displayText }}</div>
  <div v-if="attachmentCount > 0" class="content-tweet__media">
    <div
      class="content-tweet__media-grid"
      :class="`content-tweet__media-grid--${attachmentCount}`"
    >
      <div
        v-for="(attachment, index) in displayAttachments"
        :key="index"
        class="content-tweet__media-item"
      >
        <img
          v-if="!isAttachmentFailed(index)"
          :src="attachment"
          :alt="`Tweet attachment ${index + 1}`"
          @error="onImageError(index)"
        />
        <div v-else class="content-tweet__media-error">
          <span class="content-tweet__media-error-icon">!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./ContentTweet.scss" />
