<script setup lang="ts">
import { inject, computed } from "vue";
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

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};

const [DefineInput, ReuseInput] = createReusableTemplate();
</script>

<template>
  <DefineInput>
    <div class="ink-input">
      <input
        v-if="editable"
        class="ink-input__input"
        :value="modelValue"
        @input="onInput"
      />
      <span v-else class="ink-input__value">{{ modelValue }}</span>
    </div>
  </DefineInput>

  <InkField v-if="useField" :label="label" :layout="fieldLayout">
    <ReuseInput />
  </InkField>

  <template v-else>
    <ReuseInput />
  </template>
</template>

<style lang="scss" scoped src="./InkInput.scss" />
