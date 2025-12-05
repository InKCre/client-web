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

- Use i18n for text content

### Template

- Use `<span>` instead of `<p>` for inline text

### Naming

- Naming event handler following `on<Element><Event>`, for example `onButtonClick`
