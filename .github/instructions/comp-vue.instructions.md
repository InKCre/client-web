---
applyTo: "src/components/**/*.vue"
---

## Example

```vue
<script setup lang="ts">
import { compNameProps, compNameEmits } from "./<compName>";

const props = defineProps(compNameProps);
// const model = defineModel({ type: String }); use defineModel for v-model
const emit = defineEmits(compNameEmits);

// --- data ---

// --- computed ---

// --- methods ---

// --- watchers ---

// --- lifecycle hooks ---

// --- exposes ---
</script>

<style lang="scss" scoped src="./compName.scss" />
```

## Best Practices

- Avoid hard-encoded strings, use i18n instead
- Make use of VueUse composables when possible

### Template

- Use `<span>` instead of `<p>` for inline text
- If template is duplicated inside a component and no third one will reuse it, define a reusable template inside the component scope using [VueUse createReusableTemplate](https://vueuse.org/core/createReusableTemplate/), instead of creating a new component.

### Naming

- Naming event handler following `on<Element><Event>`, for example `onButtonClick`
