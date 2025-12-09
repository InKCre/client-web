<script setup lang="ts">
import { ref, computed } from "vue";
import { inkTooltipProps, inkTooltipEmits } from "./InkTooltip";

const props = defineProps(inkTooltipProps);
const emit = defineEmits(inkTooltipEmits);

const showTooltip = ref(false);

const tooltipClass = computed(() => [
  "ink-tooltip",
  `ink-tooltip--${props.position}`,
  {
    "ink-tooltip--visible": showTooltip.value,
  },
]);
</script>

<template>
  <div
    class="ink-tooltip-wrapper"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <slot />

    <div v-if="content" :class="tooltipClass">
      <div class="ink-tooltip__content">
        {{ content }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./InkTooltip.scss"></style>
