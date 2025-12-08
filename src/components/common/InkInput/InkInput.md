# InkInput

## Rationale

A common input component for text input fields.

## Goals

Provide a consistent input field for forms.

## Specification

Displays an input field or read-only value. When used inside InkForm with a label, it automatically integrates with InkField for consistent field layout.

## Implementation

### Props

- `value` (`string`, `""`)：The input value
- `editable` (`boolean`, `false`)：Whether the field is editable
- `prop` (`string`, `""`)：The property name for form binding
- `label` (`string`, `""`)：The field label. When provided and inside InkForm, the component uses InkField internally
- `layout` (`"inline" | "col" | "row"`, `"inline"`)：The field layout (only applies when inside InkForm with label). If not specified, inherits from InkForm's layout

### Events

- `update:value(value: string)`: Emitted when the input value changes
