# Native Extensions

Scope: `extensions/**`. Stable Release, Registry, and Module Federation delivery truth belongs to
[`docs/40-deployment/native-extension-delivery.md`](../docs/40-deployment/native-extension-delivery.md).

Host/producer runtime contracts belong to
[`docs/30-unit-tdd/native-extension-runtime.md`](../docs/30-unit-tdd/native-extension-runtime.md).

## Local Tripwires

- Keep each directory an independent build package. Its directory name is the local ID;
  `package.json#inkcre.name`, version, nickname, and `module_federation` association are Registry
  identity and compatibility inputs, not playground metadata.
- Keep production remotes relocatable: `vite.config.ts` must retain `base: './'`, emit the native
  `mf-manifest.json`, and write `dist/client-web`.
- Export host-consumed capabilities from `src/index.ts`; keep `src/main.ts` limited to the local
  playground. Do not make the Host depend on playground bootstrap behavior.
- Changes to a native producer must preserve the asset-closure validation. Record its Release intent
  in the corresponding core-py Extension release fragment; do not select it in Changesets.
- The unified Core release plan generates native package versions in the isolated build checkout.
  Committed native package versions are development metadata, not a second Release authority.

## Required Check

```bash
pnpm build
```
