<script setup lang="ts">
import { nextTick, ref, withDefaults } from "vue";
import type ArcEditor from "~/components/info-base/ArcEditor.vue";
import { Block } from "~/logic/info-base/block";
import { ArcForm, StarGraphForm } from "~/logic/info-base/root";

const props = withDefaults(
  defineProps<{
    modelValue: ArcForm[];
    type: "incoming" | "outgoing";
    relationType?: "x" | "y";
  }>(),
  { relationType: "x" },
);

const container = ref<HTMLDivElement>();
const index = ref(0);
const prevButton = ref<HTMLButtonElement>();
const nextButton = ref<HTMLButtonElement>();
const arcEditors = ref<InstanceType<typeof ArcEditor>[]>([]);

function addArc() {
  const newBlock = new Block("text", "");
  const newArc = new ArcForm(
    { content: "" },
    props.type === "incoming" ? null : new StarGraphForm(newBlock),
    props.type === "incoming" ? new StarGraphForm(newBlock) : null,
  );
  props.modelValue.push(newArc);
  nextTick(() => {
    index.value = props.modelValue.length - 1;
    scrollTo();
  });
}

function prev() {
  if (index.value > 0) {
    index.value--;
    scrollTo();
    prevButton.value?.classList.add("pressed");
    setTimeout(() => prevButton.value?.classList.remove("pressed"), 200);
  } else {
    prevButton.value?.classList.add("shake");
    setTimeout(() => prevButton.value?.classList.remove("shake"), 500);
  }
}

function next() {
  if (index.value < props.modelValue.length - 1) {
    index.value++;
    scrollTo();
    nextButton.value?.classList.add("pressed");
    setTimeout(() => nextButton.value?.classList.remove("pressed"), 200);
  } else {
    addArc();
    nextButton.value?.classList.add("pressed");
    setTimeout(() => nextButton.value?.classList.remove("pressed"), 200);
  }
}

function scrollTo() {
  if (container.value) {
    const children = container.value.children;
    if (children[index.value]) {
      children[index.value].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      nextTick(() => {
        arcEditors.value[index.value]?.focusBlock(true);
      });
    }
  }
}

function handleKeydown(event: KeyboardEvent) {
  const isBlockEditorFocused = arcEditors.value.some((editor) =>
    editor?.isFocusing(),
  );
  if (!isBlockEditorFocused) return;

  if (event.altKey && event.key === "Tab") {
    event.preventDefault();
    if (event.shiftKey) {
      prev();
    } else {
      next();
    }
  }

  if (event.shiftKey && event.key === "Backspace") {
    event.preventDefault();
    if (props.modelValue.length > 0) {
      const newValue = props.modelValue.filter((_, i) => i !== index.value);
      if (index.value >= newValue.length) {
        index.value = Math.max(0, newValue.length - 1);
      }
      scrollTo();
    }
  }

  if (event.shiftKey && event.key === "Delete") {
    event.preventDefault();
    if (props.modelValue.length > 0) {
      props.modelValue.splice(index.value, 1);
      if (index.value >= props.modelValue.length) {
        index.value = Math.max(0, props.modelValue.length - 1);
      }
      scrollTo();
    }
  }
}

defineExpose({ addArc, prev, next });
</script>

<template>
    <div
        :class="[
            'arcs-editor-wrapper',
            type === 'incoming' ? 'incoming' : 'outgoing',
        ]"
    >
        <div
            ref="container"
            class="arcs-container"
            tabindex="0"
            @keydown="handleKeydown"
        >
            <div
                v-for="(arc, arcIndex) in props.modelValue"
                :key="type + arcIndex.toString()"
                class="arc-item"
            >
                <ArcEditor
                    ref="arcEditors"
                    :modelValue="arc"
                    :type="type"
                    :relationType="relationType"
                />
            </div>
        </div>
        <div v-if="props.modelValue.length > 1" class="navigation-controls">
            <span class="arc-counter"
                >{{ index + 1 }}/{{ props.modelValue.length }}</span
            >
            <div class="nav-buttons">
                <button
                    ref="prevButton"
                    @click="prev"
                    class="nav-button prev-button"
                    :disabled="index <= 0"
                >
                    &larr;
                </button>
                <button
                    ref="nextButton"
                    @click="next"
                    class="nav-button next-button"
                >
                    &rarr;
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss" src="./ArcsEditor.scss"></style>
