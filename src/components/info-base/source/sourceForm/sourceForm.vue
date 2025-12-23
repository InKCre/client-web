<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  InkInput,
  InkJsonEditor,
  InkField,
  InkSwitch,
  InkDropdown,
  InkPicker,
  type DropdownOption,
} from "@inkcre/web-design";
import collectAtForm from "@/components/info-base/source/collectAtForm/collectAtForm.vue";
import { sourceFormProps, sourceFormEmits } from "./sourceForm";
import { CollectAt, SourceType } from "@/business/info-base/source";
import { useI18n } from "vue-i18n";

const props = defineProps(sourceFormProps);
const emit = defineEmits(sourceFormEmits);
const { t } = useI18n();

// --- data ---
const configJson = ref<string>("");
const sourceTypes = ref<(DropdownOption & SourceType)[]>([]);
const collectAtModel = ref<CollectAt | null>(null);

// --- computed ---
const toggleAutoCollect = computed({
  get: () => collectAtModel.value != null,
  set: (value: boolean) => {
    if (value) {
      if (collectAtModel.value == null) {
        collectAtModel.value = CollectAt.parse({});
      }
    } else {
      collectAtModel.value = null;
    }
    emit("update:modelValue", {
      ...props.modelValue,
      collect_at: collectAtModel.value,
    });
  },
});

const currentSourceType = computed(() => {
  return sourceTypes.value.find((type) => type.value === props.modelValue.type);
});

// --- methods ---
const loadSourceTypes = async (): Promise<(DropdownOption & SourceType)[]> => {
  const result = await SourceType.getAll();
  return result.map((type) => ({
    label: type.id,
    value: type.id,
    ...type,
  }));
};

const onNicknameUpdate = (value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    nickname: value,
  });
};

const onTypeUpdate = (value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    type: value,
  });
};

const onCollectAtUpdate = (value: CollectAt) => {
  collectAtModel.value = value;
  emit("update:modelValue", {
    ...props.modelValue,
    collect_at: value,
  });
};

const onConfigUpdate = (value: string) => {
  configJson.value = value;
  try {
    const parsedConfig = JSON.parse(value);
    emit("update:modelValue", {
      ...props.modelValue,
      config: parsedConfig,
    });
  } catch (error) {
    // Invalid JSON, don't update
  }
};

// --- watchers ---
watch(
  () => props.modelValue.config,
  (newVal) => {
    configJson.value = JSON.stringify(newVal || {}, null, 2);
  },
  { immediate: true }
);

watch(
  () => props.modelValue.collect_at,
  (newVal) => {
    collectAtModel.value = newVal;
  },
  { immediate: true }
);
</script>

<template>
  <div class="source-form">
    <InkInput
      :modelValue="modelValue.nickname"
      :label="t('source.nickname')"
      editable
      @update:modelValue="onNicknameUpdate"
    />

    <InkDropdown
      :modelValue="modelValue.type"
      v-model:options="sourceTypes"
      :refresher="loadSourceTypes"
      :label="t('source.type')"
      @update:modelValue="onTypeUpdate"
    />

    <InkField :label="t('source.collectAt')" prop="collect_at">
      <template #label-right>
        <div class="flex flex-row flex-1 justify-end">
          <InkSwitch v-model="toggleAutoCollect" size="xs" />
        </div>
      </template>
      <collectAtForm
        v-if="collectAtModel"
        v-model="collectAtModel"
        @update:modelValue="onCollectAtUpdate"
      />
      <span v-else class="source-form__collect-at-placeholder">
        {{ t("source.collectAtOff") }}
      </span>
    </InkField>

    <InkJsonEditor
      :modelValue="configJson"
      :schema="currentSourceType?.config_schema"
      :label="t('source.config')"
      :placeholder="t('source.configPlaceholder')"
      :rows="6"
      @update:modelValue="onConfigUpdate"
    />
  </div>
</template>

<style lang="scss" scoped src="./sourceForm.scss" />
