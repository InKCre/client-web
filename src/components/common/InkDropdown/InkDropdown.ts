import type { PropType } from "vue";
import { makeStringProp, makeBooleanProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";

// --- Types ---
export interface DropdownOption {
  label: string;
  value: string | number;
}

// --- Props ---
export const inkDropdownProps = {
  ...formControlCommonProps,
  options: {
    type: Array as PropType<DropdownOption[]>,
    default: () => [],
  },
  modelValue: {
    type: [String, Number] as PropType<
      DropdownOption["value"] | undefined | null
    >,
    default: "",
  },
  placeholder: makeStringProp("Select an option"),
  displayAs: makeStringProp<"box">("box"),
} as const;

// --- Emits ---
export const inkDropdownEmits = {
  "update:modelValue": (value: DropdownOption["value"]) => true,
  change: (value: DropdownOption["value"]) => true,
} as const;
