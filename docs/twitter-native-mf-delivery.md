# Twitter Native Module Federation Delivery

`inkcre/twitter` is released as one native Module Federation snapshot. Its package version is the
exact Registry Release version; its `package.json` also owns the canonical name, nickname, and
`@inkcre/core` Host SDK range.

## Production Flow

1. A push to protected `main` runs `Client checks`, including the full workspace contract and
   native manifest-closure validation. The run retains exact `client-web-dist` and
   `twitter-mf-dist` artifacts.
2. The delivery controller accepts only a successful same-repository push run whose checked SHA is
   still `main`.
3. A Twitter source or shared-Host input change requires a package version change. An unchanged
   version skips native publication.
4. For a new version, the controller prepares the Release with its Host SDK association and
   distribution-owned source provenance, uploads the checked snapshot ZIP as multipart `content`,
   then publishes it.
5. The controller reads the public exact Release, Registry-materialized `mf-manifest.json`, and
   every referenced shared/exposed asset back. It proves that only `metaData.publicPath` changed and
   that every executable byte matches the checked snapshot.
6. A final `main` check precedes deployment of the exact checked Pages artifact.

Pull requests, merge-group runs, manually dispatched checks, and preview deployments cannot enter
the production publication path. Publication uses only the scoped Registry bearer secret in the
protected production environment.

The public Registry defaults to `https://registry.inkcre.dev`; an explicit
`INKCRE_EXTENSION_REGISTRY_URL` repository variable may still override it for an
operator-controlled deployment. Client runtime configuration remains a deployment-owned value
rather than a build-time constant.

## Native Snapshot Contract

The producer retains `base: './'` and emits `mf-manifest.json`. Local and CI validation follows the
manifest's Remote entry plus all synchronous/asynchronous shared and exposed JS/CSS references.
The snapshot is uploaded without a generic target descriptor or a rewritten producer manifest.

The prepare request places `source_repository`, `source_revision`, and optional `build_id` inside
`module_federation`, beside `host_sdk` and `host_sdk_version`. This provenance belongs to the Web
distribution independently of any Python distribution attached to the same Release. Delivery
reruns for one checked artifact reuse its source revision and producing check-run identity.

## Local Checks

```bash
pnpm exec vitest run scripts/twitter-mf-distribution.test.mjs
pnpm --filter @inkcre/core build
pnpm --filter @inkcre/ext-twitter build
node scripts/verify-twitter-mf-distribution.mjs inspect-local \
  --package extensions/twitter/package.json \
  --core-package packages/core/package.json \
  --artifact-directory extensions/twitter/dist/client-web
```

Local checks never publish. Do not copy the Registry token into a file or run the protected delivery
requests from a developer machine.
