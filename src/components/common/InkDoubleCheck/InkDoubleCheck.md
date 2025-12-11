# InkDoubleCheck

## Rationale

Provides a confirmation mechanism for destructive or irreversible actions, preventing accidental clicks.

## Goals

- Intercept default slot click events
- Display a confirmation popup
- Only execute the action after user confirmation
- Provide customizable confirmation messages

## Specification

The component wraps any clickable element and intercepts its click event. When clicked, it opens a popup with a confirmation message. The original action is only executed after the user confirms.

## Implementation

### Props

- `title` (`string`, `"Confirm Action"`): Title text for the confirmation popup
- `message` (`string`, `"Are you sure you want to proceed?"`): Message text for the confirmation popup
- `confirmText` (`string`, `"Confirm"`): Text for the confirm button
- `cancelText` (`string`, `"Cancel"`): Text for the cancel button

### Events

- `confirm()`: Emitted when user confirms the action

### Slots

- `default`: The clickable element to wrap (e.g., a button)

### Behavior

1. Intercepts click events on the default slot content
2. Opens a confirmation popup
3. Emits `confirm` event only when user clicks the confirm button
4. Closes popup on both confirm and cancel
