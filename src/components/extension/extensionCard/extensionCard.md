# ExtensionCard

A component that displays extension information and provides controls for toggling enable/disable status and editing configuration.

## Props

- `extension` (Extension, required): The extension object to display

## Emits

- `toggle`: Emitted when the user toggles the enable/disable switch
- `edit-config`: Emitted after the extension configuration is successfully updated

## Features

- Display extension ID, version, and optional nickname
- Toggle enable/disable status with a switch
- Edit extension configuration via JSON editor in a dialog
- Auto-formats configuration as JSON for easier editing
