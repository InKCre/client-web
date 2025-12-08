import { makeStringProp, makeBooleanProp } from "@/utils/vue-props";
import { formControlCommonProps } from "../InkForm/InkForm";
import type { PropType } from "vue";

// --- Types ---
type DisplayValueAs = "inline-text" | "box";
type InkPickerType = "date" | "time" | "datetime";

// --- Props ---
export const inkPickerProps = <T>() =>
  ({
    ...formControlCommonProps,
    modelValue: {
      type: [String, Object, Date] as PropType<T>,
    },
    type: makeStringProp<InkPickerType>(),
    displayValueAs: makeStringProp<DisplayValueAs>("inline-text"),
    formatter: {
      type: Function as PropType<(value: T) => string>,
    },
    showPopup: makeBooleanProp(false),
  } as const);

// --- Emits ---
export const inkPickerEmits = <T>() =>
  ({
    pick: () => true,
    "update:modelValue": (value: T) => true,
    "update:showPopup": (value: boolean) => true,
  } as const);
