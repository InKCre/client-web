import { makeStringProp, makeNumberProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";

// --- Props ---
export const inkJsonEditorProps = {
  ...formControlCommonProps,
  // Ensured to be a valid JSON string
  modelValue: makeStringProp(""),
  placeholder: makeStringProp(""),
  rows: makeNumberProp(5),
} as const;

// --- Emits ---
export const inkJsonEditorEmits = {
  "update:modelValue": (value: string) => true,
} as const;
