<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import { Block } from "@/business/info-base/block";
import { storageManager } from "@/business/info-base/storage";
import { TweetSchema, RELATION_ATTACHMENT_PHOTO, type Tweet } from "../schema";

const props = withDefaults(defineProps<ContentCompProps>(), {
  isSelected: false,
  maxWidth: 200,
  maxHeight: 150,
});

const tweet = ref<Tweet | null>(null);
const photoUrls = ref<string[]>([]);
const isLoading = ref(true);
const error = ref<Error | null>(null);

// Display text - truncated for graph view
const displayText = computed(() => {
  if (!tweet.value) return "";
  const text = tweet.value.text
    .replace(/\[photo\]/g, "")
    .replace(/\[video\]/g, "")
    .replace(/\[link\]/g, "")
    .trim();
  const maxLen = 80;
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
});

onMounted(async () => {
  try {
    // Parse tweet from block content
    const rawContent = props.resolver.block.content;
    tweet.value = TweetSchema.parse(JSON.parse(rawContent));

    // Get relations and filter by photo pattern
    const relations = await props.resolver.getRelations();
    const photoRelations = relations.filter((r) =>
      r.content.startsWith(RELATION_ATTACHMENT_PHOTO)
    );

    // Load first photo from related blocks (for preview)
    if (photoRelations.length > 0) {
      const rel = photoRelations[0];
      const blockId =
        rel.from_ === props.resolver.block.id ? rel.to_ : rel.from_;
      const photoBlock = await Block.get(blockId);
      if (photoBlock) {
        const url = await storageManager.getRawContent(photoBlock);
        if (typeof url === "string") {
          photoUrls.value.push(url);
        }
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e));
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="content-tweet"
    :class="{ 'content-tweet--selected': isSelected }"
    :style="{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }"
  >
    <div v-if="isLoading" class="content-tweet__loading">...</div>
    <div v-else-if="error" class="content-tweet__error">
      {{ error.message }}
    </div>
    <template v-else-if="tweet">
      <div class="content-tweet__header">
        <span class="content-tweet__icon">𝕏</span>
        <span class="content-tweet__user">@{{ tweet.user_id }}</span>
      </div>
      <div class="content-tweet__text">{{ displayText }}</div>
      <div v-if="photoUrls.length" class="content-tweet__media">
        <img :src="photoUrls[0]" alt="Tweet photo" class="content-tweet__img" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.content-tweet {
  background: sys-var(color, surface, base);
  overflow: hidden;

  &__loading {
    @include apply-font(label-lg);
    color: sys-var(color, text, subtle);
  }

  &__error {
    @include apply-font(label-sm);
    color: sys-var(color, text, danger);
  }

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
