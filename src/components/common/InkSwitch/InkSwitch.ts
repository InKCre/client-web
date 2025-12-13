import type { PropType } from "vue";
import { makeBooleanProp, makeStringProp } from "@/utils/vue-props";

// --- Types ---

// --- Props ---
export const inkSwitchProps = {
  modelValue: {
    type: [Boolean, Promise] as PropType<boolean | Promise<boolean>>,
    default: false,
  },
  // TODO add SizeItems type
  size: makeStringProp<"xs" | "sm" | "md" | "lg">("md"),
  showLabel: makeBooleanProp(true),
  offText: makeStringProp("OFF"),
  onText: makeStringProp("ON"),
  isSwitching: makeBooleanProp(false),
} as const;

// --- Emits ---
export const inkSwitchEmits = {
  "update:modelValue": (value: boolean) => true,
} as const;
