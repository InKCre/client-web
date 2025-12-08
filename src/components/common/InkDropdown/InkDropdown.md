# InkDropdown

A form control component for selecting a single option from a dropdown list.

## Props

- `options`: Array of dropdown options with `label` and `value` properties
- `value`: Currently selected value (string | number)
- `placeholder`: Placeholder text when no option is selected (default: "Select an option")
- `editable`: Whether the dropdown can be interacted with (default: false)
- `displayAs`: How to display the dropdown - "box" (default: "box")
- `label`: Label for the field (optional, works with InkForm)
- `layout`: Layout style when used within a form (optional)

## Events

- `update:value`: Emitted when the selected value changes
- `change`: Emitted when an option is selected

## Usage

```vue
<InkDropdown
  :options="[
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
  ]"
  :value="selectedValue"
  @update:value="selectedValue = $event"
  editable
/>
```

## Features

- Integrates with InkForm for consistent form layouts
- In-place dropdown box with options appearing below
- Visual indication of selected option
- Keyboard and mouse interaction support
