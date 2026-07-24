---
applyTo: 'src/components/**/*.ts'
---

## Example

```typescript
import type { PropType } from "vue";
import { makeStringProp } from "@/utils/props";  // use utils/vue-props.ts

// --- Types ---

// --- Constants ---

// --- Props ---
export const compNameProps = {
  propName: makeStringProp<"option1" | "option2">("option1"),
  requiredProp: {
    type: Object as PropType<SomeInterface>,
    required: true,
  },
};

// --- Emits ---
export const compNameEmits = {
  eventName: (param: ParamType) => boolean;
  "update:modelValue": (value: ValueType) => true;
};

// --- Utilities ---
export function helperFunction() {
  // ...
}
```
