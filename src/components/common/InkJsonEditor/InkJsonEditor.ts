import { makeStringProp, makeNumberProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";

// --- Props ---
export const inkJsonEditorProps = {
  ...formControlCommonProps,
  modelValue: makeStringProp(""),
  placeholder: makeStringProp(""),
  rows: makeNumberProp(5),
} as const;

// --- Emits ---
export const inkJsonEditorEmits = {
  "update:modelValue": (value: string) => true,
} as const;
