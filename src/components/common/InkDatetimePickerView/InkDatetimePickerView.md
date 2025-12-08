# InkDatetimePickerView

## Rationale

A comprehensive picker view for selecting weekday, date, and time values.

## Goals

Provide an interactive picker interface for datetime selection that can be triggered by InkPicker.

## Specification

Displays scrollable columns for selecting weekday, date (year, month, day), and time (hour, minute). Each column can be independently enabled or disabled based on the mode prop.

## Implementation

### Props

- `modelValue` (`Date`, `new Date()`)：The selected datetime value
- `mode` (`string`, `"datetime"`)：Picker mode, supports "date", "time", "datetime", "weekday", "weekday-date", "weekday-datetime"
- `minDate` (`Date`, optional)：Minimum selectable date
- `maxDate` (`Date`, optional)：Maximum selectable date
- `hourFormat` (`string`, `"24"`)：Hour format, "12" or "24"

### Events

- `update:modelValue(value: Date)`: Emitted when the selected value changes
- `confirm()`: Emitted when user confirms selection
- `cancel()`: Emitted when user cancels selection

### Models

- `modelValue` (`Date`, `new Date()`, required)：Two-way binding for selected datetime
