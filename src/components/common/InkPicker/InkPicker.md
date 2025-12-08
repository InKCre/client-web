# InkPicker

## Rationale

A unified picker component that combines field, value display, formatter, popup, and picker view functionality.

## Goals

Provide a consistent picker field for forms that integrates field layout, value formatting, and picker interactions.

## Specification

Displays a value that can be clicked to pick, in inline or box layout. When used inside InkForm with a label, it automatically integrates with InkField for consistent field layout. The component combines:

- Field wrapper (via InkField when inside InkForm with label)
- Value display with formatting (via formatter prop)
- Picker view (via InkDatetimePickerView when type is set)
- Click interaction (via pick event)

## Implementation

### Props

- `modelValue` (`string | any`, `""`)：The value to display and edit
- `editable` (`boolean`, `true`)：Whether the picker is clickable
- `type` (`"date" | "time" | "datetime" | undefined`, `undefined`)：If set, uses InkDatetimePickerView for the specified mode
- `displayValueAs` (`"inline-text" | "box"`, `"inline-text"`)：The display style
- `formatter` (`(value: any) => string | undefined`, `undefined`)：Custom formatter function for the display value
- `showPopup` (`boolean`, `false`)：Controls the visibility of the popup
- `prop` (`string`, `""`)：The property name for form binding
- `label` (`string`, `""`)：The field label. When provided and inside InkForm, the component uses InkField internally
- `layout` (`"inline" | "col" | "row" | undefined`, `undefined`)：The field layout (only applies when inside InkForm with label). If not specified, inherits from InkForm's layout

### Events

- `pick()`: Emitted when the picker is clicked and editable
- `update:modelValue(value: any)`: Emitted when the model value changes
- `update:showPopup(value: boolean)`: Emitted when the popup visibility changes

### Models

- `modelValue` (`string | any`, `""`)：The value to display and edit
- `showPopup` (`boolean`, `false`)：Controls the visibility of the popup

### Slots

- `default`: custom picker view in popup
  - mount when `props.type` not set
  - `closePopup() => void` will be provided
