# Native Extension Delivery

This document owns the operational Release and Registry delivery contract for native client-web
Extensions. Extension lifecycle and Host internals belong to
[Native Extension Runtime](../30-unit-tdd/native-extension-runtime.md). A producer is an
`extensions/*/package.json` declaring `inkcre.module_federation`; its package version is the
exact Registry Release version, and its `inkcre` metadata owns the canonical Extension identity and
compatible `@inkcre/core` Host SDK range.

## Release Intent and Versioning

Contributors record intent with `pnpm changeset`, selecting only affected independently releasable
Extension packages. On a protected `main` push,
[`.github/workflows/extension-release.yml`](../../.github/workflows/extension-release.yml) runs the
**Native Extension release** lifecycle:

- With pending changesets, Changesets Action runs `pnpm release:version` and creates or updates the
  Extension Version PR. That PR owns generated package versions and changelogs; contributors do not
  edit those outputs separately. The reconciliation step does not publish, create GitHub Releases,
  or push tags.
- After the Version PR is merged and no changesets remain, the publish job checks out that exact
  release revision, installs the frozen workspace, and builds `@inkcre/core` plus every
  `extensions/*` producer itself. It never downloads CI artifacts.
- Producers are discovered from package metadata. An already-associated native Module Federation
  Release is a no-op; a missing association is prepared with provenance, uploaded, published, and
  read back from the public Registry for verification.

Client checks, Pages production, and Pages preview are separate application lifecycles. They cannot
publish native Extensions. Local development and local verification must never publish either.

## Registry Authority and Secret Boundary

Publication runs only in the protected GitHub `production` environment. The scoped bearer secret
`INKCRE_EXTENSION_REGISTRY_TOKEN` belongs only to the native Extension publish job; it must not be
copied to a file, exposed to Pages or checks, or used for protected delivery from a developer
machine. The public Registry defaults to `https://registry.inkcre.dev`; operators may override only
the endpoint through repository variable `INKCRE_EXTENSION_REGISTRY_URL`.

The workflow records `source_repository`, `source_revision`, and a release-workflow `build_id` in
the Module Federation distribution before upload. These Web-distribution provenance facts remain
independent of any Python distribution attached to the same Registry Release.

## Snapshot and Verification

Each producer retains the relative artifact base `base: './'`, emits
`dist/client-web/mf-manifest.json`, and declares its Registry association in package metadata. The
distribution verifier follows the manifest Remote entry and every synchronous or asynchronous
shared/exposed JavaScript and CSS reference. The uploaded snapshot is therefore self-contained and
relocatable; publication does not invent a generic target descriptor or rewrite the producer
manifest.

The executable contract is
[`scripts/verify-native-extension-distribution.mjs`](../../scripts/verify-native-extension-distribution.mjs),
guarded by [`scripts/native-extension-distribution.test.mjs`](../../scripts/native-extension-distribution.test.mjs).
Verify locally without publishing:

```bash
pnpm exec vitest run scripts/native-extension-distribution.test.mjs
pnpm --filter @inkcre/core build
pnpm --filter './extensions/*' build
node scripts/verify-native-extension-distribution.mjs inspect-local \
  --package extensions/<extension>/package.json \
  --core-package packages/core/package.json \
  --artifact-directory extensions/<extension>/dist/client-web
```
