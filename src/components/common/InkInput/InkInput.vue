<script setup lang="ts">
import { inject, computed, ref } from "vue";
import { createReusableTemplate } from "@vueuse/core";
import { inkInputProps, inkInputEmits } from "./InkInput";
import InkField from "../InkField/InkField.vue";
import { INK_FORM_CONTEXT_KEY } from "../InkForm/InkForm";

const props = defineProps(inkInputProps);
const emit = defineEmits(inkInputEmits);

const formContext = inject(INK_FORM_CONTEXT_KEY, null);

const useField = computed(() => formContext !== null && props.label);
const fieldLayout = computed(
  () => props.layout || formContext?.layout || "inline"
);

const isInlineEditing = ref(false);
const originalValue = ref("");

const onInput = (e: Event) => {
  // For inline type, don't emit immediately - wait for Enter
  if (props.type !== "inline") {
    const target = e.target as HTMLInputElement;
    emit("update:modelValue", target.value);
  }
};

const onInlineClick = () => {
  if (props.type === "inline") {
    originalValue.value = props.modelValue;
    isInlineEditing.value = true;
  }
};

const onInlineKeyup = (e: KeyboardEvent) => {
  if (props.type === "inline") {
    if (e.key === "Enter") {
      // Save the value
      const target = e.target as HTMLInputElement;
      emit("update:modelValue", target.value);
      isInlineEditing.value = false;
    } else if (e.key === "Escape") {
      // Cancel editing, restore original value
      isInlineEditing.value = false;
    }
  }
};

const onInlineBlur = () => {
  if (props.type === "inline") {
    // Exit editing without saving
    isInlineEditing.value = false;
  }
};

const [DefineInput, ReuseInput] = createReusableTemplate();
</script>

<template>
  <DefineInput>
    <div
      v-if="props.type === 'inline'"
      class="ink-input ink-input--inline"
      :class="{ 'ink-input--inline-editing': isInlineEditing }"
    >
      <input
        v-if="isInlineEditing"
        class="ink-input__input"
        :value="modelValue"
        :placeholder="placeholder"
        autofocus
        @input="onInput"
        @keyup="onInlineKeyup"
        @blur="onInlineBlur"
      />
      <span v-else class="ink-input__inline-text" @click="onInlineClick">
        <slot>
          {{ modelValue }}
        </slot>
      </span>
    </div>
    <div v-else class="ink-input">
      <input
        v-if="editable"
        class="ink-input__input"
        :value="modelValue"
        :placeholder="placeholder"
        @input="onInput"
      />
      <span v-else class="ink-input__value">{{ modelValue }}</span>
    </div>
  </DefineInput>

  <InkField
    v-if="useField"
    :label="label"
    :layout="fieldLayout"
    :required="required"
  >
    <ReuseInput />
  </InkField>

  <template v-else>
    <ReuseInput />
  </template>
</template>

<style lang="scss" scoped src="./InkInput.scss" />
