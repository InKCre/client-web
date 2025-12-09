import { makeBooleanProp, makeStringProp } from "@/utils/vue-props";

// --- Types ---

// --- Props ---
export const inkSwitchProps = {
  modelValue: makeBooleanProp(false),
  // TODO add SizeItems type
  size: makeStringProp<"xs" | "sm" | "md" | "lg">("md"),
} as const;

// --- Emits ---
export const inkSwitchEmits = {
  "update:modelValue": (value: boolean) => true,
} as const;
