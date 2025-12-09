<script setup lang="ts">
import { computed, ref, watch } from "vue";
import InkField from "@/components/common/InkField/InkField.vue";
import InkButton from "@/components/common/InkButton/InkButton.vue";
import InkPicker from "@/components/common/InkPicker/InkPicker.vue";
import collectAtForm from "@/components/info-base/source/collectAtForm/collectAtForm.vue";
import { sourceCardEmits, type SourceCardProps } from "./sourceCard";
import { CollectAt, Source } from "@/business/info-base/source";
import { useCloned, computedAsync } from "@vueuse/core";

const props = defineProps<SourceCardProps>();
const emit = defineEmits(sourceCardEmits);

// --- data ---
const sourceData = computedAsync(
  async (): Promise<Source> => {
    if (props.source) {
      return props.source;
    } else if (props.sourceId) {
      return await Source.get(props.sourceId);
    }
    throw new Error("Either 'source' or 'sourceId' must be provided");
  },
  undefined,
  { shallow: false }
);
const collectAtModel = ref<CollectAt | null>(null);

// --- watchers ---
watch(
  () => sourceData.value?.collect_at,
  (newVal) => {
    collectAtModel.value = newVal ? useCloned(newVal).cloned.value : null;
  },
  { immediate: true }
);

// --- computed ---
const formattedConfig = computed(() => {
  return JSON.stringify(sourceData.value?.config || {}, null, 2);
});

// --- methods ---
const onEditConfig = () => {
  emit("editConfig", sourceData.value!);
};

const onRunNow = () => {
  emit("run", sourceData.value!);
};

const onDelete = () => {
  emit("delete", sourceData.value!);
};

const onConfirmCollectAt = () => {
  sourceData.value!.collect_at = useCloned(collectAtModel.value).cloned.value;
  sourceData.value!.save();
};
</script>

<template>
  <div v-if="sourceData" class="source-card">
    <div class="source-card__metadata">
      <div class="source-card__left">
        <span class="source-card__type">{{ sourceData.type }}</span>
        <span class="source-card__nickname">{{ sourceData.nickname }}</span>
      </div>
      <div class="source-card__right">
        <span class="source-card__id-label">#</span>
        <span class="source-card__id">{{ sourceData.id }}</span>
      </div>
    </div>

    <InkField
      class="source-card__collect-at"
      label="Will run collect at"
      layout="inline"
    >
      <InkPicker
        :modelValue="sourceData.collect_at"
        :formatter="CollectAt.format"
        displayValueAs="inline-text"
      >
        <template #default="{ closePopup }">
          <div class="collect-at-form__title">
            Schedule when to run source collect
          </div>
          <collectAtForm v-model="collectAtModel" />
          <div class="collect-at-form__actions">
            <InkButton text="Cancel" type="subtle" @click="closePopup" />
            <InkButton
              text="Confirm"
              type="primary"
              @click="
                onConfirmCollectAt();
                closePopup();
              "
            />
          </div>
        </template>
      </InkPicker>
    </InkField>

    <div class="source-card__config">
      <pre class="source-card__config-text">{{ formattedConfig }}</pre>
    </div>

    <div class="source-card__operations">
      <div class="source-card__operations-left">
        <InkButton text="Delete" type="danger" size="sm" @click="onDelete" />
      </div>
      <div class="source-card__operations-right">
        <InkButton
          text="Edit Config"
          type="subtle"
          size="sm"
          @click="onEditConfig"
        />
        <InkButton text="Run Now" type="subtle" size="sm" @click="onRunNow" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./sourceCard.scss" />
