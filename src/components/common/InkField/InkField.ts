import { makeStringProp, makeBooleanProp } from "@/utils/vue-props";

// --- Types ---
export type FieldLayout = "inline" | "col" | "row";

// --- Props ---
export const inkFieldProps = {
  label: makeStringProp("Label"),
  layout: makeStringProp<FieldLayout>("col"),
  value: makeStringProp(""),
  editable: makeBooleanProp(true),
} as const;

// --- Emits ---
export const inkFieldEmits = {
  "value-click": () => true,
} as const;
