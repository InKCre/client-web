---
applyTo: "src/components/**/*"
---

## File Structure

Each component has a standalone folder (`compName/`), containing the following files:

- `compName.md`: component documentation, [detailed guide](./comp-doc.instructions.md)
- `compName.vue`: template, component specific logic, [detailed guide](./comp-vue.instructions.md)
- `compName.ts`: component props, emits, models, types, constants, utilities, [detailed guide](./comp-ts.instructions.md)
- `compName.scss`: component styles, [detailed guide](./style.instructions.md)

## Best Practices

- Single Responsibility Principle
- High Cohesion and Low Coupling
- Easy to Test and Maintain
- Clear and consistent API
- Avoid prop drilling
- Proper use of provide/inject

### Interface

- if prop `modelValue` is mutable, and the component tends to be state less, name it `value` and should not have emit `update:value`

### Naming

- `camelCase` for component name, variables, functions
- `kebab-case` for selectors, events

### Error Handling

- Graceful degradation
- User-friendly error messages
- Logging
