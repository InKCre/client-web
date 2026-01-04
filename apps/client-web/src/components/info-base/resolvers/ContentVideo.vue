<script setup lang="ts">
import { ref, computed } from "vue";
import type { ContentCompProps } from "@inkcre/core";
import type { VideoContent } from "@inkcre/core";

type VideoRawContent = string | VideoContent;

const props = defineProps<ContentCompProps<VideoRawContent>>();

const thumbnailError = ref(false);

const thumbnailUrl = computed(() => {
  if (typeof props.solvedContent !== "string") {
    const content = props.solvedContent as VideoContent;
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
  <div class="content-video">
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
