# collectJobForm

## Rationale

Provides a form interface to configure a source collect job.

## Goals

Allow users to configure collect job settings including config object.

## Specification

- Pure form component with v-model support
- Provides config editor (InkJsonEditor)
- No create/submit buttons - just form fields
- Parent component handles submission

## Implementation

### Props

- `modelValue` (`SourceCollectJobForm`, required): The form data object

### Events

- `update:modelValue(form: SourceCollectJobForm)`: Emitted when form data changes
