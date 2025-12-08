<script setup lang="ts">
import { computed } from "vue";
import { inkPopupProps, inkPopupEmits, type PopupPosition } from "./InkPopup";

const props = defineProps(inkPopupProps);
const emit = defineEmits(inkPopupEmits);

const open = defineModel<boolean>("open", { default: false });

const positionClasses = computed(() => {
  const pos = props.position;
  if (typeof pos === "string") {
    return `ink-popup--${pos}`;
  }
  return "";
});

const positionStyles = computed(() => {
  const pos = props.position;
  if (!Array.isArray(pos)) {
    return {};
  }

  const [top, right, bottom, left] = pos;
  const styles: Record<string, string | number> = {};

  if (top !== undefined && top !== null) styles.top = `${top}px`;
  if (right !== undefined && right !== null) styles.right = `${right}px`;
  if (bottom !== undefined && bottom !== null) styles.bottom = `${bottom}px`;
  if (left !== undefined && left !== null) styles.left = `${left}px`;

  return styles;
});

const onScrimClick = () => {
  if (props.closeOnScrim) {
    open.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="ink-popup-fade">
      <div v-if="open" class="ink-popup-overlay" @click="onScrimClick"></div>
    </Transition>

    <Transition name="ink-popup-slide">
      <div
        v-if="open"
        :class="['ink-popup', positionClasses]"
        :style="positionStyles"
      >
        <slot></slot>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped src="./InkPopup.scss" />
