<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import type { ImageContent } from "@/business/info-base/storages/http";
import { storageManager } from "@/business/info-base/storage";

const props = withDefaults(defineProps<ContentCompProps>(), {
  isSelected: false,
  maxWidth: 120,
  maxHeight: 90,
});

const rawContent = ref<string | ImageContent | null>(null);
const isLoading = ref(true);
const error = ref<Error | null>(null);
const imageError = ref(false);

const imageSrc = computed(() => {
  if (!rawContent.value) {
    // Fallback to block.content as URL
    return props.resolver.block.content;
  }

  if (typeof rawContent.value === "string") {
    return rawContent.value;
  }

  // ImageContent from storage
  const content = rawContent.value as ImageContent;
  if (content.dataUrl) {
    return content.dataUrl;
  }
  if (content.blob) {
    return URL.createObjectURL(content.blob);
  }
  return content.url;
});

const onLoad = () => {
  isLoading.value = false;
};

const onError = () => {
  imageError.value = true;
  isLoading.value = false;
};

onMounted(async () => {
  try {
    rawContent.value = await storageManager.getRawContent(props.resolver.block);
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e));
  }
});
</script>

<template>
  <div
    class="content-image"
    :class="{ 'content-image--selected': isSelected }"
    :style="{ width: `${maxWidth}px`, height: `${maxHeight}px` }"
  >
    <div v-if="isLoading" class="content-image__loading">
      <span class="content-image__spinner"></span>
    </div>
    <img
      v-show="!imageError && !isLoading"
      :src="imageSrc"
      alt="Block image"
      class="content-image__img"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="imageError" class="content-image__error">
      <span class="content-image__error-icon">!</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.content-image {
  border-radius: sys-var(radius, none);
  overflow: hidden;
  background: sys-var(color, surface, subtle);
  display: flex;
  align-items: center;
  justify-content: center;

  &--selected {
    box-shadow: 0 0 0 2px sys-var(color, border, primary);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid sys-var(color, border, subtle);
    border-top-color: sys-var(color, border, primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: sys-var(color, text, subtle);
  }

  &__error-icon {
    @include apply-font(label-lg);
    color: sys-var(color, text, subtle);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
