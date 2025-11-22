# ExtensionConfigEditor Component

A modal dialog for editing extension configuration in JSON format.

## Properties

- `extension: Extension` - The extension whose configuration is being edited
- `visible: boolean` - Whether the editor modal is visible

## Emits

- `close` - When user cancels or closes the editor
- `save` - When user saves the configuration with the new config object

## Features

- Modal dialog with overlay
- JSON text editor with syntax highlighting
- Input validation for valid JSON format
- Save/Cancel actions
- Error handling for invalid JSON
