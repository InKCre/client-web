# InkField

## Rationale

Displaying and editing key-value pairs.

## Props

- `label` (string, default: "Label"): The field label
- `layout` ("inline" | "col" | "row", default: "inline"): The field layout
  - `inline`: Inline label and value
  - `col`: Column layout (vertical stacking)
  - `row`: Row layout (horizontal stacking with flex-start alignment)
- `value` (string, default: ""): The field value to display as text (used when no slot content provided)
- `editable` (boolean, default: false): Whether the field value is editable. When true and layout is inline, the value text will be underlined
- `required` (boolean, default: false): Whether the field is required. If true, displays a red `*` at the top right of the label

## Slots

- `default`: The value slot, where you place the value editing / displaying component (e.g., InkInput, InkPicker). If no slot content is provided, the `value` prop will be rendered as text.

## Events

- `value-click()`: Emitted when the value is clicked
