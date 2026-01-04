<script setup lang="ts">
import { computed } from "vue";
import { useConfigStore } from "@inkcre/core";

// Get config store
const configStore = useConfigStore();

const props = withDefaults(defineProps<{ modelValue?: string }>(), {
  modelValue: () => configStore.config.defaultModel,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});

// Compute available models from all providers
const availableModels = computed(() => {
  const models: { value: string; label: string; disabled: boolean }[] = [];

  configStore.config.llmProviders.forEach((provider) => {
    const hasApiKey = provider.apiKey && provider.apiKey.length > 0;
    provider.models.forEach((model) => {
      models.push({
        value: `${provider.id}:${model}`,
        label: `${provider.name} - ${model}`,
        disabled: !hasApiKey,
      });
    });
  });

  return models;
});
</script>

<template>
  <div class="provider-picker">
    <label for="model-select" class="picker-label">模型:</label>
    <select id="model-select" v-model="localValue" class="picker-select">
      <option
        v-for="model in availableModels"
        :key="model.value"
        :value="model.value"
        :disabled="model.disabled"
      >
        {{ model.label }}
        {{ model.disabled ? "(未配置)" : "" }}
      </option>
    </select>
  </div>
</template>

<style scoped lang="scss" src="./ProviderPicker.scss"></style>
