import { makeStringProp, makeBooleanProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";

// --- Types ---
type FieldLayout = "inline" | "col" | "row";

// --- Props ---
export const inkInputProps = {
  ...formControlCommonProps,
  modelValue: makeStringProp(""),
  placeholder: makeStringProp(""),
} as const;

// --- Emits ---
export const inkInputEmits = {
  "update:modelValue": (value: string) => true,
} as const;
