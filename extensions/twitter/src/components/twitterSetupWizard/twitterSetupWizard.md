# TwitterSetupWizard

Twitter-owned four-step setup contribution mounted by the client-web Extension dialog.

- Discovers reachable Core Peers through the ordinary `Client` API.
- Requires explicit Core enablement before setup commands are available.
- Configures the user's X OAuth App, opens the standalone provider flow, and polls only the opaque transaction reference.
- Selects or creates a Bookmark Source and explicitly starts initial collection.
- Derives progress from Core setup facts; it does not persist a wizard step.
