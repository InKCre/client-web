# InstallExtension

A component that provides a form interface for installing new extensions.

## Emits

- `install`: Emitted after an extension is successfully installed

## Features

- Inline form for one canonical `namespace/name` and exact version
- Install button with loading state
- The parent supplies installation on the selected Host. The browser requires a Web distribution;
  a live Core validates its Python distribution. Installation does not enable either Host.
- Offline installation is disabled; failures retain the input and never select another Host.
- Automatic form reset after successful installation
