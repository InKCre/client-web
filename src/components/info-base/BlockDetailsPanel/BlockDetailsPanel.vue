<script setup lang="ts">
import { ref, watch } from "vue";
import { InkButton, InkField, InkLoading } from "@inkcre/web-design";
import {
  blockDetailsPanelProps,
  blockDetailsPanelEmits,
} from "./BlockDetailsPanel";
import {
  resolverRegistry,
  type RenderedContent,
} from "@/business/info-base/resolver";
import { useI18n } from "vue-i18n";

const props = defineProps(blockDetailsPanelProps);
const emit = defineEmits(blockDetailsPanelEmits);

const { t } = useI18n();

// --- data ---
const renderedContent = ref<RenderedContent | null>(null);
const isLoading = ref(false);

// --- computed ---

// --- methods ---
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

const onButtonClickClose = () => {
  emit("close");
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString();
};

// --- watchers ---
watch(
  () => props.block,
  () => {
    resolveContent();
  },
  { immediate: true }
);

// --- lifecycle hooks ---

// --- exposes ---
</script>

<template>
  <div class="block-details-panel">
    <!-- Header -->
    <div class="block-details-panel__header">
      <h3 class="block-details-panel__title">
        {{ t("infoBase.blockDetails.title") }}
      </h3>
      <InkButton theme="subtle" type="icon" @click="onButtonClickClose">
        <span class="i-mdi-close" />
      </InkButton>
    </div>

    <!-- Metadata -->
    <div class="block-details-panel__metadata">
      <InkField
        :label="t('infoBase.blockDetails.id')"
        :value="String(block.id)"
        :editable="false"
      />

      <InkField
        :label="t('infoBase.blockDetails.resolver')"
        :value="block.resolver"
        :editable="false"
      />

      <InkField
        :label="t('infoBase.blockDetails.created')"
        :value="formatDate(block.created_at)"
        :editable="false"
      />

      <InkField
        :label="t('infoBase.blockDetails.updated')"
        :value="formatDate(block.updated_at)"
        :editable="false"
      />

      <InkField
        v-if="block.storage"
        :label="t('infoBase.blockDetails.storage')"
        :value="String(block.storage)"
        :editable="false"
      />
    </div>

    <!-- Content -->
    <div class="block-details-panel__content">
      <div class="block-details-panel__content-label">
        {{ t("infoBase.blockDetails.content") }}
      </div>
      <div v-if="isLoading" class="block-details-panel__content-rendered">
        <InkLoading size="sm" />
      </div>
      <div
        v-else-if="renderedContent"
        class="block-details-panel__content-rendered"
        v-html="renderedContent.html"
      />
      <div v-else class="block-details-panel__content-rendered">
        {{ t("infoBase.blockDetails.noContent") }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./BlockDetailsPanel.scss" />
