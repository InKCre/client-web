# sourceForm

## Rationale

Provides a reusable form for editing source information including nickname, type, config, and collect schedule.

## Goals

Allow users to edit source configuration in a consistent way across different views.

## Specification

- Pure form component with v-model support
- Provides all fields: nickname, type, config (InkJsonEditor), collect schedule
- No save button - parent component handles submission
- Supports both create and edit modes

## Implementation

### Props

- `modelValue` (`Source | SourceForm`, required): The source data object

### Events

- `update:modelValue(source: Source | SourceForm)`: Emitted when form data changes
