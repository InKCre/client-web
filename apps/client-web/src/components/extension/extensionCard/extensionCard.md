# ExtensionCard

A component that displays extension information and provides controls for toggling enable/disable status and editing configuration.

## Props

- `extension` (InstalledExtension, required): the canonical installed row
- `enabled` (boolean, required): whether the selected Client's Peer UUID is in `enabled[]`
- `controlsCurrentWebRuntime` (boolean, required): whether the switch owns this browser's runtime
- `setEnabled` (function, required): application-level selected-Client control operation

## Emits

- `updated`: Emitted with the canonical row after configuration or version changes
- `uninstalled`: Emitted after the canonical row is removed

## Features

- Display canonical Extension Name, exact version, and optional nickname
- Toggle enable/disable status with a switch
- Mount an Extension-owned setup contribution from this browser's running Web Distribution
- Keep setup availability independent of which Client is selected for enablement control
- Edit extension configuration via JSON editor in a dialog
- Change the exact shared version only while every Peer is disabled
- Auto-formats configuration as JSON for easier editing
- Prevents uninstall while any Peer remains enabled
