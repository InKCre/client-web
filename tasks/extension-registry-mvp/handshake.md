# Cross-Repository Impact Handshake

## Ownership Boundary

- **ext-reg** owns release state, target conditions, artifact manifests/bytes, and Runtime/API.
- **core-py** owns shared installation/binding schema, migration, Core API behavior, and the
  production image. Client-web does not alter those contracts.
- **client-web** owns browser target selection, Module Federation lifecycle, browser-local
  runtime effects, and current Web peer binding persistence.

## Browser Topology

```text
deployment clients.config
  ├─ extension_registry_url ──> public Registry (exact release / digest manifest)
  └─ extension_management_peer_id ──> reachable Core peer (install/config/uninstall API)

current Web peer ──> PostgREST extension_peer_bindings + local Module Federation lifecycle
configured Core peer ──> /extension-installations/{namespace}/{name}/enable|disable
```

- The browser's own client row has `rest_api_url = null`; it must never be used as a Core API
  endpoint. `extension_management_peer_id` is explicit deployment authority, not inferred from
  a URL, name, or stale row.
- The UI permits only the current Web peer and that configured management Core peer. It rejects
  arbitrary browser/protocol peers rather than guessing their lifecycle route.
- Legacy `extensions` remains an isolated transition table. Client-web no longer boots its
  legacy lifecycle automatically; a data migration is a separate decision.

## Required Production Handoff

1. [complete] Provision the deployed browser client config with the production Registry URL and
   exact management Core peer UUID. Neither value is present in static source, environment
   defaults, or Pages artifacts.
2. Confirm the management Core peer permits the browser's authenticated calls to all required
   `/extension-installations` routes, including 204 uninstall.
3. Confirm PostgREST RLS/grants let the browser read its current peer binding and insert/delete
   its own `extension_peer_bindings` row. The browser also needs enough binding visibility for a
   helpful uninstall preflight; Core's delete route remains the authoritative all-peer guard.
4. Perform the published-target browser acceptance: install exact coordinate, select compatible
   target, load digest artifact and chunks, enable, restart current peer, disable, and uninstall.

## Open Conflict / Risk Record

- The generated schema proves table shape only; it cannot prove deployed PostgREST RLS/grants.
  A denied binding write/read must be treated as a production integration blocker, not bypassed
  by client-side state.
- The production browser config was corrected from localhost to canonical deployment values. Its
  recovery/reprovisioning mechanism remains deployment-owned rather than a static client concern.
- Binding rows omit entrypoint/artifact format. The adapter uses the immutable digest manifest to
  recover entrypoint on startup; if Registry artifact delivery is unavailable, it leaves the
  persisted binding intact and reports startup failure rather than deleting it.
