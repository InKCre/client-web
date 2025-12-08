<script setup lang="ts">
import { provide, computed } from "vue";
import {
  inkFormProps,
  inkFormEmits,
  INK_FORM_CONTEXT_KEY,
  type InkFormContext,
} from "./InkForm";

const props = defineProps(inkFormProps);
const emit = defineEmits(inkFormEmits);

// --- provide form context ---
const formContext = computed<InkFormContext>(() => ({
  layout: props.layout,
}));

provide(INK_FORM_CONTEXT_KEY, formContext.value);

// --- methods ---
const onSubmit = (e: Event) => {
  e.preventDefault();
  emit("submit", e);
};
</script>

<template>
  <form class="ink-form" @submit="onSubmit">
    <slot />
  </form>
</template>

<style lang="scss" scoped src="./InkForm.scss" />
