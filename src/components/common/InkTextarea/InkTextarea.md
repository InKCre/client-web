# InkTextarea

## Rationale

A textarea component for editing multi-line text.

## Goals

Provide a consistent textarea field for forms.

## Specification

Displays an editable textarea or read-only formatted text. When used inside InkForm with a label, it automatically integrates with InkField for consistent field layout.

## Implementation

### Props

- `value` (`string`, `""`)：The textarea value
- `editable` (`boolean`, `false`)：Whether the field is editable
- `placeholder` (`string`, `""`)：Placeholder text
- `rows` (`number`, `5`)：Number of visible rows
- `prop` (`string`, `""`)：The property name for form binding
- `label` (`string`, `""`)：The field label. When provided and inside InkForm, the component uses InkField internally
- `layout` (`"inline" | "col" | "row"`, `"inline"`)：The field layout (only applies when inside InkForm with label). If not specified, inherits from InkForm's layout

### Events

- `update:value(value: string)`: Emitted when the textarea value changes
