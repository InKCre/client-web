<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted, watch } from "vue";
import { createReusableTemplate } from "@vueuse/core";
import { inkJsonEditorProps, inkJsonEditorEmits } from "./InkJsonEditor";
import InkField from "../InkField/InkField.vue";
import { INK_FORM_CONTEXT_KEY } from "../InkForm/InkForm";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

const props = defineProps(inkJsonEditorProps);
const emit = defineEmits(inkJsonEditorEmits);

const formContext = inject(INK_FORM_CONTEXT_KEY, null);

const useField = computed(() => formContext !== null && props.label);
const fieldLayout = computed(() => props.layout || formContext?.layout);

// --- data ---
const editorRef = ref<HTMLDivElement>();
let editorView: EditorView | null = null;
const editableCompartment = new Compartment();

// --- methods ---
const createEditor = () => {
  if (!editorRef.value) return;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      json(),
      closeBrackets(),
      keymap.of(closeBracketsKeymap),
      keymap.of([...defaultKeymap, indentWithTab]),
      editableCompartment.of(EditorView.editable.of(props.editable)),
      placeholder(props.placeholder),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit("update:modelValue", update.state.doc.toString());
        }
      }),
      // Basic styling
      EditorView.theme({
        "&": {
          height: "auto",
          minHeight: `${props.rows * 1.4}em`, // Approximate
        },
        ".cm-scroller": {
          fontFamily: '"Monaco", "Courier New", monospace',
        },
      }),
    ],
  });

  editorView = new EditorView({
    state,
    parent: editorRef.value,
  });
};

const updateEditorValue = (newValue: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue,
      },
    });
  }
};

onMounted(() => {
  createEditor();
});

onUnmounted(() => {
  if (editorView) {
    editorView.destroy();
  }
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (editorView && editorView.state.doc.toString() !== newValue) {
      updateEditorValue(newValue);
    }
  }
);

watch(
  () => props.editable,
  (newEditable) => {
    if (editorView) {
      editorView.dispatch({
        effects: editableCompartment.reconfigure(
          EditorView.editable.of(newEditable)
        ),
      });
    }
  }
);

const [DefineJsonEditor, ReuseJsonEditor] = createReusableTemplate();
</script>

<template>
  <DefineJsonEditor>
    <div class="ink-json-editor">
      <div
        ref="editorRef"
        :class="[
          'ink-json-editor__editor',
          { 'ink-json-editor__editor--readonly': !editable },
        ]"
      />
    </div>
  </DefineJsonEditor>

  <InkField
    v-if="useField"
    :label="label"
    :layout="fieldLayout"
    :required="required"
  >
    <ReuseJsonEditor />
  </InkField>

  <template v-else>
    <ReuseJsonEditor />
  </template>
</template>

<style lang="scss" scoped src="./InkJsonEditor.scss" />
