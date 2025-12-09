# InkDropdown

A form control component for selecting a single option from a dropdown list with support for lazy-loaded options.

## Rationale

Provide a consistent dropdown selection control that supports both static and dynamically loaded options.

## Goals

- Single-option selection from a dropdown list
- Support for static and lazy-loaded options
- Automatic loading state management
- Integration with InkForm for consistent form layouts

## Key Concepts

- Static options: Pre-defined array of options passed directly
- Lazy-loaded options: Options loaded on-demand when the dropdown is opened

## Specification

The dropdown displays a clickable box with the currently selected value. When opened, it shows available options. The component can accept options either as a static array or as an async function that fetches options when the dropdown is opened.

## Implementation

### Props

- `options` (`DropdownOption[] | () => Promise<DropdownOption[]>`, `[]`): Options source, either a static array or an async function
  - When `options` is a function, the options are loaded asynchronously when the dropdown is opened. The component displays a loading indicator during this time.
- `modelValue` (`string | number | undefined | null`, `""`): Currently selected value
- `placeholder` (`string`, `"Select an option"`): Placeholder text when no option is selected
- `editable` (`boolean`, `false`): Whether the dropdown can be interacted with
- `displayAs` (`"box"`, `"box"`): Display style
- `showRefresh` (`boolean`, `false`): Show a refresh button to manually reload lazy options. Only displayed when `options` is a function
- `label` (`string`, optional): Label for the field when used within InkForm
- `layout` (`FieldLayout`, optional): Layout style when used within a form

### Events

- `update:modelValue(value: string | number)`: Emitted when the selected value changes
- `change(value: string | number)`: Emitted when an option is selected

### Methods

#### Loading

The component automatically manages loading state internally when `options` is a function. The loading indicator is displayed while options are being fetched.

### Watchers

- `props.options`: Resets resolved options when the options source changes

## Others

### Lazy Loading

When `options` is a function, the options are loaded asynchronously when the dropdown is opened or when the refresh button is clicked. The component displays a loading indicator during this time.

### Refresh Button

The refresh button appears next to the dropdown box when `showRefresh` is `true` and `options` is a function. Clicking the button will reload the options asynchronously. The button is disabled during loading to prevent multiple concurrent requests.
