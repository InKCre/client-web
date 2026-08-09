# Evidence Snapshot

Observed facts only. Decisions and remaining work are in [plan.md](plan.md).

## Registry And Core Inputs

- `@inkcre/extension-runtime@0.1.2` is the public anonymous release tarball at
  `https://github.com/InKCre/ext-reg/releases/download/v0.1.2/inkcre-extension-runtime-0.1.2.tgz`.
  Its SHA-256 is `12ce4cd736b364cccb42dd05b9f7f526b89c3444deefb4feeb52242b9a17d20a`.
- The public Registry Worker origin is known operational evidence, but it is not compiled into
  client-web. Production provisioning must write it into the deployed browser client's
  `extension_registry_url`.
- Core PR [#47](https://github.com/InKCre/core-py/pull/47) merged as `19632baa`; its admitted
  image is `ghcr.io/inkcre/core-py@sha256:b8f43a7a9a558e6bb4d86e2d31baffe826a250dcdf32c9faf457a279e836ad10`
  and migration head is `f2a6c8e4b1d7`.
- Core's idempotent-delivery corrections later produced and deployed
  `ghcr.io/inkcre/core-py@sha256:1de46f335de355a8a9eb27e2784089b4cdef35ad66d64788ae233a1cdf80e670`.
  The Python target remains immutably attributed to its original source `19632baa` and build
  `31333702751`, while the image records its independent delivery revision.

## Exact Contract Generation

- The local default Docker provider is unavailable. With explicit authorization, the official
  SSH provider ran `pnpm contract:sync -- --image <exact digest>` and reported
  `synchronized ... through Supabase CLI`.
- The same provider then ran `pnpm contract:check -- --image <exact digest>` and reported
  `verified ... through Supabase CLI`.
- Generated `database.generated.ts` and `runtime-contract.generated.json` now identify source
  revision `19632baa5ed1dbd8064387181e557a530a9eec84` and contain:

  - `extension_installations(namespace, name, version, config, config_schema)`;
  - `extension_peer_bindings(namespace, name, version, peer_id, target_key, target_digest)`;
  - the installation/version and peer/client foreign keys.

## Runtime Semantics Observed From Released Contracts

- `RegistryClient.getPublishedRelease()` resolves an exact published coordinate;
  `selectCompatibleTarget()` fails closed for a missing or unknown mandatory condition;
  `artifactFileUrl()` builds the digest-addressed artifact URL.
- `ExtensionLifecycleController.enable()` compensates a failed load/initialize/activate. Host
  code owns binding persistence only after it succeeds; `disable()` performs deactivate and
  dispose before it succeeds.
- Core routes own global installation/config/uninstall:
  `GET|POST /extension-installations`, `DELETE /extension-installations/{namespace}/{name}`
  (204), and namespaced config routes. Core's enable/disable routes start Core's own Python
  target, so the current Web peer must select/load its Web target locally.
- A binding does not persist its entrypoint. Client startup therefore lists only bindings for the
  current Web peer and reads the immutable artifact manifest by binding digest; it never
  re-resolves a mutable release.

## Client Changes And Focused Evidence

- `ClientConfigSchema` preserves unconfigured empty Registry/management-peer values and accepts
  deployment-injected `extension_management_peer_id` UUIDs. It contains no production default.
- `Client.request()` now treats successful 204 responses as `undefined`, including after a 401
  retry; this is required for Core uninstall.
- Production browser acceptance exposed that a valid Core `rest_api_url` ending in `/` was joined
  with an absolute request path as `//extension-installations`, which Heroku rejected with 404.
  The shared Client URL join now normalizes boundary slashes for both health and API requests; its
  regression test uses the production-shaped trailing-slash base URL.
- The Registry adapter keeps legacy `Extension` isolated. It writes a local binding only after
  MF load/initialize/activate succeeds; on persistence failure it compensates runtime. Disable
  retains the binding if cleanup fails. If cleanup succeeds but deleting the binding fails, it
  re-enables the runtime so the still-enabled persisted authority and process agree. Uninstall
  first checks bindings then relies on Core's authoritative guard.
- The adapter force-registers MF remotes to clear old runtime/module caches before loading a
  re-enabled or changed exact digest.
- Focused core test run passed: 18 tests across Registry lifecycle, no-target/unknown-condition,
  Registry outage, 204 handling, null-self management peer, remote Core dispatch, and third-peer
  rejection. Core and client-web type checks passed at that point.
- Full `pnpm check` passed after the target-delivery and runtime/UI changes converged: formatting,
  lint, type checking, 67 tests, all workspace builds, and the static/package contracts.
- Protected-main `Client checks` run `31336494562` passed and retained the exact
  `client-web-dist` and `twitter-target-dist` artifacts for source
  `c488ebe6c81b0fd889f79179bb52b1b7be493c41`.
- Delivery run `31336623861` published `inkcre/twitter@0.1.0#web-module-federation-v1` as
  `sha256:1cfb7744dcb97cecfe427b39f79994a3809f02a88be7ad67e2ef42f92d0a8220`, with the
  exact main source revision and that delivery run as first provenance. It correctly withheld
  Pages deployment when its verification request omitted a browser `Origin` header and therefore
  observed no CORS response header from standard CORS middleware.
- Direct production probes that include `Origin: https://app.inkcre.dev` receive
  `Access-Control-Allow-Origin: *` for the public release, immutable artifact manifest, and
  immutable `remoteEntry.js`. The delivery verifier now sends that representative browser origin
  and checks CORS on the release as well as every artifact response.
- Delivery run `31337195878` then proved the CORS correction and exposed a separate verifier-only
  URL drift: it percent-encoded the digest's `sha256:` separator while the released Runtime/API
  emits the canonical unescaped digest segment. The Registry fast file route correctly rejected
  that non-canonical path with 422, and Pages remained gated. The verifier now constructs the same
  canonical artifact URL as the released consumer and locks this with a regression assertion.

## Production Provisioning Evidence

- Canonical client-web row `1eaaadc6-2c1d-4515-ad06-22905dc890a9` previously contained a
  localhost Registry URL and no Core management authority.
- A bounded production mutation preserved the row identity and replaced only its config with the
  public Registry origin and canonical production Core peer
  `063cd1df-c495-5006-a119-67aa633b26be`. Neither value is compiled into the Pages artifact.
