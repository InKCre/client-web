<script setup lang="ts">
import { computed, ref } from "vue";
import type { InGraphProps } from "@/business/info-base/resolver";
import type { ImageContent } from "@/business/info-base/storages/http";

const props = withDefaults(defineProps<InGraphProps<string | ImageContent>>(), {
  isSelected: false,
  maxWidth: 120,
  maxHeight: 90,
});

const imageError = ref(false);
const imageLoading = ref(true);

const imageSrc = computed(() => {
  if (typeof props.rawContent === "string") {
    return props.rawContent;
  }
  // ImageContent from storage
  const content = props.rawContent as ImageContent;
  if (content.dataUrl) {
    return content.dataUrl;
  }
  if (content.blob) {
    return URL.createObjectURL(content.blob);
  }
  return content.url;
});

const onLoad = () => {
  imageLoading.value = false;
};

const onError = () => {
  imageError.value = true;
  imageLoading.value = false;
};
</script>

<template>
  <div
    class="in-graph-image"
    :class="{ 'in-graph-image--selected': isSelected }"
    :style="{ width: `${maxWidth}px`, height: `${maxHeight}px` }"
  >
    <div v-if="imageLoading" class="in-graph-image__loading">
      <span class="in-graph-image__spinner"></span>
    </div>
    <img
      v-show="!imageError && !imageLoading"
      :src="imageSrc"
      alt="Block image"
      class="in-graph-image__img"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="imageError" class="in-graph-image__error">
      <span class="in-graph-image__error-icon">!</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.in-graph-image {
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
