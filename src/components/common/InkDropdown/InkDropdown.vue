<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { createReusableTemplate } from "@vueuse/core";
import {
  inkDropdownProps,
  inkDropdownEmits,
  type DropdownOption,
} from "./InkDropdown";
import InkField from "../InkField/InkField.vue";
import { INK_FORM_CONTEXT_KEY } from "../InkForm/InkForm";

const props = defineProps(inkDropdownProps);
const emit = defineEmits(inkDropdownEmits);

const formContext = inject(INK_FORM_CONTEXT_KEY, null);

const useField = computed(() => formContext !== null && props.label);
const fieldLayout = computed(() => props.layout || formContext?.layout);

const showOptions = ref(false);
const isLoading = ref(false);
const resolvedOptions = ref<DropdownOption[]>([]);

// --- computed ---
const displayValue = computed(() => {
  const option = optionsList.value.find(
    (opt) => opt.value === props.modelValue
  );
  return option ? option.label : props.placeholder;
});

const optionsList = computed(() => {
  if (typeof props.options === "function") {
    return resolvedOptions.value;
  }
  return props.options;
});

// --- methods ---
const loadOptionsIfNeeded = async () => {
  if (typeof props.options === "function") {
    if (resolvedOptions.value.length > 0) {
      return;
    }
    isLoading.value = true;
    try {
      resolvedOptions.value = await props.options();
    } finally {
      isLoading.value = false;
    }
  }
};

const onRefresh = async () => {
  await loadOptionsIfNeeded();
};

const onDropdownClick = async () => {
  if (props.editable) {
    if (showOptions.value) {
      showOptions.value = false;
    } else {
      // Load options before showing dropdown
      await loadOptionsIfNeeded();
      showOptions.value = true;
    }
  }
};

const onOptionSelect = (value: DropdownOption["value"]) => {
  emit("update:modelValue", value);
  emit("change", value);
  showOptions.value = false;
};

// --- watchers ---
watch(
  () => props.options,
  () => {
    // Reset resolved options when options source changes
    if (typeof props.options !== "function") {
      resolvedOptions.value = [];
    }
  }
);

const [DefineDropdown, ReuseDropdown] = createReusableTemplate();
</script>

<template>
  <DefineDropdown>
    <div class="ink-dropdown-container">
      <!-- Box -->
      <div
        :class="[
          'ink-dropdown',
          {
            'ink-dropdown--editable': editable,
            'ink-dropdown--active': showOptions,
          },
        ]"
        @click="onDropdownClick"
      >
        <span class="ink-dropdown__value">{{ displayValue }}</span>

        <span
          v-if="editable"
          :class="['i-mdi-chevron-down', 'ink-dropdown__chevron']"
        ></span>
      </div>

      <!-- Refresh Button -->
      <button
        v-if="showRefresh && typeof options === 'function'"
        :class="[
          'ink-dropdown__refresh',
          { 'ink-dropdown__refresh--loading': isLoading },
        ]"
        :disabled="isLoading"
        @click.stop="onRefresh"
        type="button"
        title="Refresh options"
      >
        <span :class="['i-mdi-refresh', { 'animate-spin': isLoading }]"></span>
      </button>

      <!-- Options -->
      <div v-if="showOptions" class="ink-dropdown__options">
        <div v-if="isLoading" class="ink-dropdown__loading">
          <span class="i-mdi-loading animate-spin"></span>
          Loading...
        </div>
        <template v-else>
          <div v-for="option in optionsList" :key="option.value">
            <div
              :class="[
                'ink-dropdown__option',
                {
                  'ink-dropdown__option--selected': option.value === modelValue,
                },
              ]"
              @click="onOptionSelect(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </DefineDropdown>

  <InkField v-if="useField" :label="label" :layout="fieldLayout">
    <ReuseDropdown />
  </InkField>

  <template v-else>
    <ReuseDropdown />
  </template>
</template>

<style lang="scss" scoped src="./InkDropdown.scss" />
