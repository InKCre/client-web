<script setup lang="ts">
import { ref, watch } from "vue";
import type { Block } from "@/business/info-base/block";
import { resolverRegistry, type RenderedContent } from "@/business/info-base/resolver";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  block: Block;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { t } = useI18n();

// --- State ---
const renderedContent = ref<RenderedContent | null>(null);
const isLoading = ref(false);

// --- Methods ---
const resolveContent = async () => {
  if (!props.block) {
    renderedContent.value = null;
    return;
  }

  isLoading.value = true;
  try {
    const resolver = resolverRegistry.get(props.block.resolver);
    renderedContent.value = await resolver.resolve(props.block.content);
  } catch (error) {
    console.error("Failed to resolve block content:", error);
    renderedContent.value = {
      type: "text",
      html: "Error rendering content",
    };
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  emit("close");
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

// --- Watchers ---
watch(
  () => props.block,
  () => {
    resolveContent();
  },
  { immediate: true }
);
</script>

<template>
  <div class="block-details-panel">
    <!-- Header -->
    <div class="block-details-panel__header">
      <h3 class="block-details-panel__title">
        {{ t("infoBase.blockDetails.title", "Block Details") }}
      </h3>
      <button class="block-details-panel__close" @click="handleClose">
        ✕
      </button>
    </div>

    <!-- Metadata -->
    <div class="block-details-panel__metadata">
      <div class="block-details-panel__metadata-item">
        <div class="block-details-panel__metadata-label">
          {{ t("infoBase.blockDetails.id", "ID") }}
        </div>
        <div class="block-details-panel__metadata-value">
          {{ block.id }}
        </div>
      </div>

      <div class="block-details-panel__metadata-item">
        <div class="block-details-panel__metadata-label">
          {{ t("infoBase.blockDetails.resolver", "Resolver") }}
        </div>
        <div class="block-details-panel__metadata-value">
          {{ block.resolver }}
        </div>
      </div>

      <div class="block-details-panel__metadata-item">
        <div class="block-details-panel__metadata-label">
          {{ t("infoBase.blockDetails.created", "Created At") }}
        </div>
        <div class="block-details-panel__metadata-value">
          {{ formatDate(block.created_at) }}
        </div>
      </div>

      <div class="block-details-panel__metadata-item">
        <div class="block-details-panel__metadata-label">
          {{ t("infoBase.blockDetails.updated", "Updated At") }}
        </div>
        <div class="block-details-panel__metadata-value">
          {{ formatDate(block.updated_at) }}
        </div>
      </div>

      <div v-if="block.storage" class="block-details-panel__metadata-item">
        <div class="block-details-panel__metadata-label">
          {{ t("infoBase.blockDetails.storage", "Storage") }}
        </div>
        <div class="block-details-panel__metadata-value">
          {{ block.storage }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="block-details-panel__content">
      <div class="block-details-panel__content-label">
        {{ t("infoBase.blockDetails.content", "Content") }}
      </div>
      <div
        v-if="isLoading"
        class="block-details-panel__content-rendered"
      >
        {{ t("common.loading", "Loading...") }}
      </div>
      <div
        v-else-if="renderedContent"
        class="block-details-panel__content-rendered"
        v-html="renderedContent.html"
      />
      <div
        v-else
        class="block-details-panel__content-rendered"
      >
        {{ t("infoBase.blockDetails.noContent", "No content") }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockDetailsPanel.scss" />
