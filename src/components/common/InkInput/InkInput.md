# InkInput

## Rationale

A common input component for text input fields with support for different input modes.

## Goals

Provide a consistent input field for forms with flexible display options including inline editing mode.

## Specification

Displays an input field or read-only value based on the `type` prop. When used inside InkForm with a label, it automatically integrates with InkField for consistent field layout.

## Implementation

### Props

- `value` (`string`, `""`)：The input value
- `editable` (`boolean`, `false`)：Whether the field is editable (for default type)
- `prop` (`string`, `""`)：The property name for form binding
- `label` (`string`, `""`)：The field label. When provided and inside InkForm, the component uses InkField internally
- `layout` (`"inline" | "col" | "row"`, `"inline"`)：The field layout (only applies when inside InkForm with label). If not specified, inherits from InkForm's layout
- `type` (`"default" | "inline"`, `"default"`)：The input type. `"default"` shows an input with border, `"inline"` displays as plain text and switches to an input on click
- `placeholder` (`string`, `""`)：Placeholder text for the input

### Events

- `update:value(value: string)`: Emitted when the input value changes

### Slots

- `default`: Customize the display value in inline mode. If not provided, displays the `modelValue` by default.

### Inline Type Behavior

When `type="inline"`:

- Displays as plain text by default
- Clicking the text enters edit mode
- Shows a bordered input field in edit mode (same as default type)
- **Pressing Enter saves the edit and exits edit mode**
- **Pressing Esc or clicking outside exits edit mode without saving changes**
- Use the default slot to customize how the value is displayed
