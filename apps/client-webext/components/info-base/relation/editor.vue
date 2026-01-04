<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { RelationForm } from "~/logic/info-base/relation";

const props = withDefaults(
  defineProps<{
    modelValue: RelationForm;
    type: "x" | "y";
  }>(),
  {
    type: "x",
  },
);

const editing = ref(false);
const inputRef = ref<HTMLInputElement>();

function save() {
  editing.value = false;
}

defineExpose({
  focus: (preventScroll: boolean) => {
    editing.value = true;
    nextTick(() => {
      inputRef.value?.focus({ preventScroll });
    });
  },
  isFocusing: () => inputRef.value === document.activeElement,
});
</script>

<template>
    <div
        v-if="props.type === 'x'"
        class="relative w-full flex items-center justify-center h-8"
    >
        <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-full h-px bg-border"></div>
        </div>
        <div class="absolute bg-surface px-2 cursor-pointer">
            <span
                v-if="!editing"
                @click="editing = true"
                class="text-sm text-muted"
            >
                {{ props.modelValue.content || "某种联系" }}
            </span>
            <input
                v-else
                ref="inputRef"
                v-model="props.modelValue.content"
                @blur="save"
                @keyup.enter="save"
                class="text-sm text-muted bg-transparent border-none outline-none w-20 text-center"
                placeholder="某种联系"
            />
        </div>
    </div>
    <div v-else class="w-full flex h-12 items-center px-4 gap-x2">
        <div class="w-px bg-border h-full"></div>
        <div class="bg-surface cursor-pointer">
            <span
                v-if="!editing"
                @click="editing = true"
                class="text-sm text-muted"
            >
                {{ props.modelValue.content || "某种联系" }}
            </span>
            <input
                v-else
                ref="inputRef"
                v-model="props.modelValue.content"
                @blur="save"
                @keyup.enter="save"
                class="text-sm text-text bg-transparent border-none outline-none w-20"
                placeholder="某种联系"
            />
        </div>
    </div>
</template>
