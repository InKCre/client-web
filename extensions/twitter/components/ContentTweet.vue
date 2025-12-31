<script setup lang="ts">
import { ref, computed } from "vue";
import { type Tweet } from "../schema";
import type { ContentCompProps } from "@/business/info-base/resolver";

const props = defineProps<ContentCompProps<Tweet>>();

const photoUrls = ref<string[]>([]);

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
</script>

<template>
  <div class="content-tweet__header">
    <span class="content-tweet__icon">𝕏</span>
    <span class="content-tweet__user">@{{ props.solvedContent.user_id }}</span>
  </div>
  <div class="content-tweet__text">{{ displayText }}</div>
  <div v-if="photoUrls.length" class="content-tweet__media">
    <img :src="photoUrls[0]" alt="Tweet photo" class="content-tweet__img" />
  </div>
</template>

<style lang="scss" scoped>
.content-tweet {
  background: sys-var(color, surface, base);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: sys-var(space, xs);
    margin-bottom: sys-var(space, xs);
  }

  &__icon {
    font-size: 14px;
    font-weight: bold;
  }

  &__user {
    @include apply-font(label-sm);
    color: sys-var(color, text, subtle);
    font-weight: 500;
  }

  &__text {
    @include apply-font(label-lg);
    color: sys-var(color, text, base);
    word-break: break-word;
    line-height: 1.4;
  }

  &__media {
    margin-top: sys-var(space, sm);
    border-radius: sys-var(radius, sm);
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: auto;
    max-height: 80px;
    object-fit: cover;
  }
}
</style>
