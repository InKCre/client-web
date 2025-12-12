<script setup lang="ts">
import { ref, inject, computed } from "vue";
import { createReusableTemplate } from "@vueuse/core";
import { inkTextareaProps, inkTextareaEmits } from "./InkTextarea";
import InkField from "../InkField/InkField.vue";
import { INK_FORM_CONTEXT_KEY } from "../InkForm/InkForm";

const props = defineProps(inkTextareaProps);
const emit = defineEmits(inkTextareaEmits);

const formContext = inject(INK_FORM_CONTEXT_KEY, null);

const useField = computed(() => formContext !== null && props.label);
const fieldLayout = computed(() => props.layout || formContext?.layout);

// --- data ---
const textareaRef = ref<HTMLTextAreaElement>();

// --- methods ---
const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit("update:value", target.value);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.editable) return;

  const target = e.target as HTMLTextAreaElement;
  const { selectionStart, selectionEnd, value } = target;

  // No special key handling for basic textarea
};

const [DefineTextarea, ReuseTextarea] = createReusableTemplate();
</script>

<template>
  <DefineTextarea>
    <div class="ink-textarea">
      <textarea
        v-if="editable"
        ref="textareaRef"
        class="ink-textarea__input"
        :value="value"
        :placeholder="placeholder"
        :rows="rows"
        @input="handleInput"
        @keydown="handleKeyDown"
      />
      <div v-else class="ink-textarea__value">{{ value }}</div>
    </div>
  </DefineTextarea>

  <InkField
    v-if="useField"
    :label="label"
    :layout="fieldLayout"
    :required="required"
  >
    <ReuseTextarea />
  </InkField>

  <template v-else>
    <ReuseTextarea />
  </template>
</template>

<style lang="scss" scoped src="./InkTextarea.scss" />
