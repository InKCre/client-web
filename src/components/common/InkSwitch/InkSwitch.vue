<script setup lang="ts">
import { computed, watch } from "vue";
import { useAsyncState } from "@vueuse/core";
import { inkSwitchProps, inkSwitchEmits } from "./InkSwitch";

const props = defineProps(inkSwitchProps);
const emit = defineEmits(inkSwitchEmits);

const {
  state: currentValue,
  isLoading: isSwitchingInternal,
  execute,
} = useAsyncState(
  async () => {
    const v = props.modelValue;
    return v instanceof Promise ? await v : v;
  },
  false,
  {
    immediate: true,
    resetOnExecute: false,
  }
);

watch(
  () => props.modelValue,
  async (newVal) => {
    await execute();
  }
);

const switchClass = computed(() => [
  "ink-switch",
  `ink-switch--${props.size}`,
  { "ink-switch--on": currentValue.value },
]);

const labelText = computed(() =>
  currentValue.value ? props.onText : props.offText
);

const isSwitching = computed(
  () => props.isSwitching || isSwitchingInternal.value
);

const handleClick = () => {
  if (!isSwitching.value) {
    emit("update:modelValue", !currentValue.value);
  }
};
</script>

<template>
  <button :class="switchClass" @click="handleClick">
    <div class="ink-switch__handle">
      <span v-if="props.showLabel && !isSwitching" class="ink-switch__label">{{
        labelText
      }}</span>
      <span v-if="isSwitching" class="i-mdi-loading animate-spin"></span>
    </div>
  </button>
</template>

<style lang="scss" scoped src="./InkSwitch.scss"></style>
