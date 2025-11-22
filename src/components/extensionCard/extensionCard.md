# ExtensionCard Component

Display individual extension information with management actions.

## Properties

- `extension: Extension` - The extension object to display
- `showConfig?: boolean` - Whether to show configuration details (default: false)

## Emits

- `update-config` - When extension configuration is updated
- `toggle-enabled` - When extension is enabled/disabled
- `edit-config` - When user wants to edit the configuration

## Features

- Extension status (enabled/disabled) display
- Enable/disable toggle functionality
- Configuration editing capability
- Version and ID information display
- Nickname display if available
