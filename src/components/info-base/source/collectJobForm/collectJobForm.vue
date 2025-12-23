<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { InkJsonEditor } from "@inkcre/web-design";
import { collectJobFormProps, collectJobFormEmits } from "./collectJobForm";

const props = defineProps(collectJobFormProps);
const emit = defineEmits(collectJobFormEmits);
const { t } = useI18n();

// --- data ---
const configJson = ref<string>("");

// --- watchers ---
watch(
  () => props.modelValue.config,
  (newVal) => {
    configJson.value = JSON.stringify(newVal, null, 2);
  },
  { immediate: true }
);

watch(configJson, (newVal) => {
  try {
    const parsedConfig = JSON.parse(newVal);
    emit("update:modelValue", {
      ...props.modelValue,
      config: parsedConfig,
    });
  } catch (error) {
    // Invalid JSON, don't update
  }
});
</script>

<template>
  <div class="collect-job-form">
    <InkJsonEditor
      v-model="configJson"
      :label="t('collectJob.config')"
      :placeholder="t('source.configPlaceholder')"
      :rows="6"
    />
  </div>
</template>

<style lang="scss" scoped src="./collectJobForm.scss" />
