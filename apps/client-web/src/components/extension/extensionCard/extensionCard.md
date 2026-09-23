# ExtensionCard

A component that displays an installed Extension and opens focused Peer selection for enablement changes.

## Props

- `extension` (InstalledExtension, required): the canonical installed row
- `peers` (Peer[], required): available Peers, including this browser
- `currentPeerId` (string, required): identifies this browser's running Host
- `peerSelectionDisabled` (boolean): blocks actions while the Peer list is unavailable

## Emits

- `updated`: Emitted with the canonical row after Peer, configuration, or version changes
- `uninstalled`: Emitted after the canonical row is removed

## Features

- Display canonical Extension Name, exact version, and optional nickname
- Choose one or more eligible Peers in an enable or disable dialog. Each selected Peer uses the existing current Host, remote Host, or durable-intent path. Partial failures remain visible and trigger a fresh installed-row read; no batch rollback or automatic retry occurs.
- Mount an Extension-owned setup contribution from this browser's running Web Distribution
- Keep setup availability independent of the Peer selection dialog; disabling this browser closes its setup surface first
- Link the exact installed release's available global, Core, and Web documentation even when the extension is disabled or has no browser distribution; distinguish missing documentation from failed discovery
- Edit extension configuration via JSON editor in a dialog
- Select a published Registry Release and change the exact shared version only while every Peer is disabled
- Auto-formats configuration as JSON for easier editing
- Prevents uninstall while any Peer remains enabled
