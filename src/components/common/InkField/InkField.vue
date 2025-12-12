<script setup lang="ts">
import { computed } from "vue";
import { inkFieldProps, inkFieldEmits } from "./InkField";

const props = defineProps(inkFieldProps);
const emit = defineEmits(inkFieldEmits);

const fieldClass = computed(() => ["ink-field", `ink-field--${props.layout}`]);

const valueClass = computed(() => [
  "ink-field__value",
  {
    "ink-field__value--underlined": props.layout === "inline" && props.editable,
    "ink-field__value--clickable": props.editable,
  },
]);

const onValueClick = () => {
  emit("value-click");
};
</script>

<template>
  <div :class="fieldClass">
    <div class="flex flex-row">
      <span class="ink-field__label">
        {{ label }}
        <sup v-if="props.required" class="ink-field__required">*</sup>
      </span>
      <slot name="label-right" />
    </div>
    <slot>
      <span :class="valueClass" @click="onValueClick">{{ value }}</span>
    </slot>
  </div>
</template>

<style lang="scss" scoped src="./InkField.scss" />
