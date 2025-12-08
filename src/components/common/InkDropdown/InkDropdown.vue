<script setup lang="ts">
import { computed, inject, ref } from "vue";
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

// --- computed ---
const displayValue = computed(() => {
  const option = props.options.find((opt) => opt.value === props.modelValue);
  return option ? option.label : props.placeholder;
});

// --- methods ---
const onDropdownClick = () => {
  if (props.editable) {
    showOptions.value = !showOptions.value;
  }
};

const onOptionSelect = (value: DropdownOption["value"]) => {
  emit("update:modelValue", value);
  emit("change", value);
  showOptions.value = false;
};

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

      <!-- Options -->
      <div v-if="showOptions" class="ink-dropdown__options">
        <div
          v-for="option in options"
          :key="option.value"
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
