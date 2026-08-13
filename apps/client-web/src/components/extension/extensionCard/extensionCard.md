# ExtensionCard

A component that displays extension information and provides controls for toggling enable/disable status and editing configuration.

## Props

- `extension` (InstalledExtension, required): the canonical installed row
- `enabled` (boolean, required): whether the current Web Peer UUID is in `enabled[]`

## Emits

- `changed`: Emitted after current-Peer enablement changes and the list should be refreshed
- `updated`: Emitted with the canonical row after configuration or version changes
- `uninstalled`: Emitted after the canonical row is removed

## Features

- Display canonical Extension Name, exact version, and optional nickname
- Toggle enable/disable status with a switch
- Mount the setup component contributed by the already-running local Web Extension in a host-owned dialog
- Unmount setup content before disabling and disposing the Extension runtime
- Edit extension configuration via JSON editor in a dialog
- Change the exact shared version only while every Peer is disabled
- Auto-formats configuration as JSON for easier editing
- Prevents uninstall while any Peer remains enabled
