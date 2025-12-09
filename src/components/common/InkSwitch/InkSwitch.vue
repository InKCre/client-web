<script setup lang="ts">
import { computed } from "vue";
import { inkSwitchProps, inkSwitchEmits } from "./InkSwitch";

const props = defineProps(inkSwitchProps);
const emit = defineEmits(inkSwitchEmits);

const switchClass = computed(() => [
  "ink-switch",
  `ink-switch--${props.size}`,
  { "ink-switch--on": props.modelValue },
]);

const handleClick = () => {
  emit("update:modelValue", !props.modelValue);
};
</script>

<template>
  <div :class="switchClass" @click="handleClick">
    <div class="ink-switch__handle"></div>
  </div>
</template>

<style lang="scss" scoped src="./InkSwitch.scss"></style>
