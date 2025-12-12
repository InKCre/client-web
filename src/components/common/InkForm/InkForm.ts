import { makeBooleanProp, makeStringProp } from "@/utils/vue-props";
import type { InjectionKey } from "vue";
import type { FieldLayout } from "../InkField/InkField";

// --- Types ---
export interface InkFormContext {
  layout: FieldLayout;
}

// -- Constants ---
export const INK_FORM_CONTEXT_KEY: InjectionKey<InkFormContext> =
  Symbol("ink-form");

// --- Props ---
export const inkFormProps = {
  layout: makeStringProp<FieldLayout>("col"),
} as const;

export const formControlCommonProps = {
  prop: makeStringProp<undefined | string>(),
  label: makeStringProp<undefined | string>(),
  layout: makeStringProp<FieldLayout | undefined>(),
  editable: makeBooleanProp(true),
  required: makeBooleanProp(false),
} as const;

// --- Emits ---
export const inkFormEmits = {
  submit: (e: Event) => true,
} as const;
