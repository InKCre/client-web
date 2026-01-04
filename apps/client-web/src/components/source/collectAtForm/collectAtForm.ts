import type { PropType } from "vue";
import { CollectAt } from "@inkcre/core";

export const collectAtFormProps = {
  modelValue: {
    type: Object as PropType<CollectAt | null>,
    default: null,
  },
};

export const collectAtFormEmits = ["update:modelValue"];
