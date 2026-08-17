# Native Extension Delivery

Client-web Extensions with `package.json#inkcre.module_federation` are independently versioned
native Module Federation producers. Their package version is the exact Registry Release version;
their `inkcre` metadata owns canonical name, nickname, and `@inkcre/core` Host SDK range.

## Production Flow

1. Contributors add Changesets release intent for affected Extension packages.
2. A protected `main` push runs the independent Native Extension release workflow. Pending
   changesets cause Changesets Action to create or update one Version PR.
3. The Version PR consumes pending changesets and prepares package versions and changelogs. It does
   not publish, tag, or create GitHub Releases.
4. After the Version PR merges, the release workflow has no pending changesets. Its publication job
   checks out that release revision and builds every native Extension itself.
5. The publisher discovers packages with native distribution metadata. Already associated Registry
   Releases are no-ops; missing associations are prepared, uploaded, published, and publicly read
   back.

The release workflow never consumes artifacts produced by a CI workflow. Client checks and Pages
delivery have separate responsibilities; Pages delivery cannot read the Registry credential or
publish an Extension.

Publication uses only the scoped Registry bearer secret in the protected production environment.
The public Registry defaults to `https://registry.inkcre.dev`; an explicit
`INKCRE_EXTENSION_REGISTRY_URL` repository variable may override it for an operator-controlled
deployment.

## Native Snapshot Contract

Each native producer retains `base: './'`, emits `mf-manifest.json`, and declares its Registry
association in `package.json`. Validation follows the manifest's Remote entry plus every
synchronous/asynchronous shared and exposed JS/CSS reference. The snapshot is uploaded without a
generic target descriptor or rewritten producer manifest.

The prepare request places `source_repository`, `source_revision`, and optional `build_id` inside
`module_federation`, beside `host_sdk` and `host_sdk_version`. This provenance belongs to the Web
distribution independently of any Python distribution attached to the same Release.

## Local Checks

```bash
pnpm exec vitest run scripts/native-extension-distribution.test.mjs
pnpm --filter @inkcre/core build
pnpm --filter './extensions/*' build
node scripts/verify-native-extension-distribution.mjs inspect-local \
  --package extensions/mail/package.json \
  --core-package packages/core/package.json \
  --artifact-directory extensions/mail/dist/client-web
node scripts/verify-native-extension-distribution.mjs inspect-local \
  --package extensions/twitter/package.json \
  --core-package packages/core/package.json \
  --artifact-directory extensions/twitter/dist/client-web
```

Local checks never publish. Do not copy the Registry token into a file or run protected delivery
requests from a developer machine.
