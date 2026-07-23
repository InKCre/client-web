---
applyTo: 'src/components/**/*.md'
description: 'Guide for writing component documentation.'
---

## Best Practices

- Readers are Coding Agents, pay attention to Token Efficiency.
- Do not include actual code or usage examples.
- Use concise and clear language.

## Example

```markdown
# compName

## Rationale

Why do we need this component?

## Goals

The goals of the component (core functionality).

## Key Concepts

Key concepts of the component, mainly proper nouns such as business logic. (Only list them, see the `docs/` directory for details)

## Specification

Refinement of the component goals, including content, UI/UX, behavior, etc.

## Implementation

Details about the implementation of the component.

### Props

- `PropName` (`type`, `defaultVal`, [required])：Supplemental explanation

### Events

- `eventName(param: ParamType)`: Supplemental explanation

### Models

- `modelValue` (`type`, `defaultVal`, [required])：Supplemental explanation

### Slots

- `default`：supplemental explanation
- `header`：supplemental explanation

#### SlotName

> 仅当插槽比较复杂时。

### Methods

#### `methodName(param: ParamType): ReturnType {}`

Detailed explanation if needed.

### Watchers

- `props.propName`：explain callback behavior
- `refValue`：explain callback behavior

## Others
```
