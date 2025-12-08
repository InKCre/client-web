import { makeStringProp, makeBooleanProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";

// --- Types ---
export interface JsonEditConfig {
  enableIndentation?: boolean;
  enableQuoteCompletion?: boolean;
  enableCommaCompletion?: boolean;
  indentSize?: number;
}

type FieldLayout = "inline" | "col" | "row";

// --- Props ---
export const inkTextareaProps = {
  ...formControlCommonProps,
  value: makeStringProp(""),
  placeholder: makeStringProp(""),
  rows: {
    type: Number,
    default: 5,
  },
} as const;

// --- Emits ---
export const inkTextareaEmits = {
  "update:value": (value: string) => true,
} as const;
