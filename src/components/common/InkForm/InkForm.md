# InkForm

## Rationale

A form container component that provides consistent layout context for form controls.

## Goals

Provide a form wrapper that automatically configures child form controls (InkInput, InkTextarea, InkPicker) to use InkField for consistent field layouts.

## Specification

A form container that uses Vue's provide/inject API to communicate layout preferences to child form controls. Form controls inside InkForm will automatically wrap themselves with InkField.

## Implementation

### Props

- `layout` (`"inline" | "col" | "row"`, `"col"`): The default layout for all form fields inside this form

### Events

- `submit(e: Event)`: Emitted when the form is submitted

### Slots

- `default`: The form content (form controls, buttons, etc.)

### Context

The component provides `INK_FORM_CONTEXT_KEY` context that child form controls can inject to detect they are inside a form and access the default layout.
