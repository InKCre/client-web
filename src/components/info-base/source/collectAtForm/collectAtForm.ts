import type { PropType } from "vue";
import { CollectAt } from "@/business/info-base/source";

export const collectAtFormProps = {
  modelValue: {
    type: Object as PropType<CollectAt>,
    required: true,
  },
};

export const collectAtFormEmits = {};
