<script setup lang="ts">
import { computed, ref } from "vue";
import type { InGraphProps } from "@/business/info-base/resolver";
import type { VideoContent } from "@/business/info-base/storages/http";

const props = withDefaults(defineProps<InGraphProps<string | VideoContent>>(), {
  isSelected: false,
  maxWidth: 120,
  maxHeight: 90,
});

const thumbnailError = ref(false);

const videoUrl = computed(() => {
  if (typeof props.rawContent === "string") {
    return props.rawContent;
  }
  return (props.rawContent as VideoContent).url;
});

const thumbnailUrl = computed(() => {
  if (typeof props.rawContent !== "string") {
    const content = props.rawContent as VideoContent;
    if (content.thumbnailUrl) {
      return content.thumbnailUrl;
    }
  }
  return null;
});

const onThumbnailError = () => {
  thumbnailError.value = true;
};
</script>

<template>
  <div
    class="in-graph-video"
    :class="{ 'in-graph-video--selected': isSelected }"
    :style="{ width: `${maxWidth}px`, height: `${maxHeight}px` }"
  >
    <img
      v-if="thumbnailUrl && !thumbnailError"
      :src="thumbnailUrl"
      alt="Video thumbnail"
      class="in-graph-video__thumbnail"
      @error="onThumbnailError"
    />
    <div v-else class="in-graph-video__placeholder">
      <span class="in-graph-video__icon">
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
    <div class="in-graph-video__badge">VIDEO</div>
  </div>
</template>

<style lang="scss" scoped>
.in-graph-video {
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
</style>
