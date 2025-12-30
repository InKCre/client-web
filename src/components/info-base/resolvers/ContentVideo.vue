<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ContentCompProps } from "@/business/info-base/resolver";
import type { VideoContent } from "@/business/info-base/storages/http";
import { storageManager } from "@/business/info-base/storage";

const props = withDefaults(defineProps<ContentCompProps>(), {
  isSelected: false,
  maxWidth: 120,
  maxHeight: 90,
});

const rawContent = ref<string | VideoContent | null>(null);
const isLoading = ref(true);
const error = ref<Error | null>(null);
const thumbnailError = ref(false);

const videoUrl = computed(() => {
  if (!rawContent.value) {
    return props.resolver.block.content;
  }
  if (typeof rawContent.value === "string") {
    return rawContent.value;
  }
  return (rawContent.value as VideoContent).url;
});

const thumbnailUrl = computed(() => {
  if (rawContent.value && typeof rawContent.value !== "string") {
    const content = rawContent.value as VideoContent;
    if (content.thumbnailUrl) {
      return content.thumbnailUrl;
    }
  }
  return null;
});

const onThumbnailError = () => {
  thumbnailError.value = true;
};

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
    class="content-video"
    :class="{ 'content-video--selected': isSelected }"
    :style="{ width: `${maxWidth}px`, height: `${maxHeight}px` }"
  >
    <div v-if="isLoading" class="content-video__loading">
      <span class="content-video__spinner"></span>
    </div>
    <template v-else>
      <img
        v-if="thumbnailUrl && !thumbnailError"
        :src="thumbnailUrl"
        alt="Video thumbnail"
        class="content-video__thumbnail"
        @error="onThumbnailError"
      />
      <div v-else class="content-video__placeholder">
        <span class="content-video__icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
          </svg>
        </span>
      </div>
      <div class="content-video__badge">VIDEO</div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.content-video {
  position: relative;
  border-radius: sys-var(radius, none);
  overflow: hidden;
  background: sys-var(color, surface, subtle);
  display: flex;
  align-items: center;
  justify-content: center;

  &--selected {
    box-shadow: 0 0 0 2px sys-var(color, border, primary);
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

  &__thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: sys-var(color, surface, subtle);
  }

  &__icon {
    color: sys-var(color, text, subtle);
    opacity: 0.6;
  }

  &__badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    @include apply-font(label-sm, true);
    border-radius: 2px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
