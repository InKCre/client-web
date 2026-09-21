# ExtensionCard

A component that displays extension information and provides controls for toggling enable/disable status and editing configuration.

## Props

- `extension` (InstalledExtension, required): the canonical installed row
- `enabled` (boolean, required): whether the selected Client's Peer UUID is in `enabled[]`
- `controlsCurrentWebRuntime` (boolean, required): whether the switch owns this browser's runtime
- `canChangeVersion` (boolean, required): whether the selected Host can validate a version change
- `changeVersion` (function, required): application-level version change through the selected Host
- `setEnabled` (function, required): application-level selected-Client control operation

## Emits

- `updated`: Emitted with the canonical row after configuration or version changes
- `uninstalled`: Emitted after the canonical row is removed

## Features

- Display canonical Extension Name, exact version, and optional nickname
- Toggle enable/disable status with a switch
- Mount an Extension-owned setup contribution from this browser's running Web Distribution
- Keep setup availability independent of which Client is selected for enablement control
- Link the exact installed release's available global, Core, and Web documentation even when the extension is disabled or has no browser distribution; distinguish missing documentation from failed discovery
- Edit extension configuration via JSON editor in a dialog
- Change the exact shared version through the selected Host only while every Peer is disabled
- Auto-formats configuration as JSON for easier editing
- Prevents uninstall while any Peer remains enabled
