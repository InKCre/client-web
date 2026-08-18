# Native Extensions

Scope: `extensions/**`. Stable Release, Registry, and Module Federation delivery truth belongs to
[`docs/40-deployment/native-extension-delivery.md`](../docs/40-deployment/native-extension-delivery.md).

Host/producer runtime contracts belong to
[`docs/30-unit-tdd/native-extension-runtime.md`](../docs/30-unit-tdd/native-extension-runtime.md).

## Local Tripwires

- Keep each directory an independently versioned package. Its directory name is the local ID;
  `package.json#inkcre.name`, version, nickname, and `module_federation` association are Registry
  identity and compatibility inputs, not playground metadata.
- Keep production remotes relocatable: `vite.config.ts` must retain `base: './'`, emit the native
  `mf-manifest.json`, and write `dist/client-web`.
- Export host-consumed capabilities from `src/index.ts`; keep `src/main.ts` limited to the local
  playground. Do not make the Host depend on playground bootstrap behavior.
- An optional setup contribution belongs to the active Extension. The application owns only the
  popup surface; the Extension owns its steps, domain operations, fact projection, and exit action.
- Changes to a native producer must preserve the asset-closure validation and select only affected
  independently releasable packages in `pnpm changeset`.

## Required Check

```bash
pnpm exec vitest run scripts/native-extension-distribution.test.mjs
```
