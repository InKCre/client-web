# InKCre Web Client(s)

This is a monorepo of InKCre that includes client-web, client-webext and infrastructure of them.

## Development prerequisites

- Node.js `22.22.3` from `.node-version`
- pnpm `10.26.2` from the root `packageManager` field
- Python `3.11+` with `sustainable-vibe-coding==10.0.1`
- Docker with Compose v2
- A GitHub token with `read:packages` access to `@inkcre/web-design`

pnpm ignores authentication credentials declared by repository-controlled npm configuration. Store the environment-variable placeholder in the trusted user configuration:

```bash
pnpm config set --global //npm.pkg.github.com/:_authToken '${NODE_AUTH_TOKEN}'
```

The single quotes are intentional: they keep the token itself out of the command arguments and write the literal placeholder. pnpm expands it from the environment when it reads the trusted user configuration.

Install every workspace package from the repository root:

```bash
git submodule update --init --recursive
pnpm install --frozen-lockfile
```

The local database capability pulls core-py's private digest-pinned runtime from GHCR. Authenticate
Docker once with a GitHub token that has `read:packages`:

```bash
gh auth refresh -h github.com -s read:packages
gh auth token | docker login ghcr.io --username YOUR_GITHUB_USERNAME --password-stdin
```

## Canonical commands

Run repository-wide commands from the root:

```bash
pnpm run doctor      # Diagnose required versions and generated state
pnpm dev             # Ensure the worktree-local database and web capabilities
pnpm dev:webext      # Ensure the worktree-local WXT capability
pnpm dev:status      # Observe capability health without starting anything
pnpm dev:stop        # Stop only this worktree's routes and database runtime
pnpm db:ready        # Emit machine-readable development database readiness
pnpm db:reset        # Explicitly reset only this worktree's guarded development database
pnpm test:e2e        # Own and remove an ephemeral database plus built-browser test runtime
pnpm dev:all         # Start the web client with local remotes
pnpm format          # Apply the Oxfmt baseline
pnpm lint            # Run the required Oxlint rules
pnpm type-check      # Type-check every workspace member
pnpm check           # Non-mutating format, lint, type, package, and build gate
pnpm build           # Build core, web, Chromium extension, and remotes
```

Type-aware Oxlint and native TypeScript 7 are green shadow lanes:

```bash
pnpm lint:type-aware
pnpm type-check:ts7
```

The required stable lane uses TypeScript 5.9 and Vue TSC. `pnpm check` includes unit tests; the
Docker-backed browser/database E2E is a separate required CI job because it owns an ephemeral
multi-container runtime.

## Local runtime

SVC resolves a stable instance for each Git worktree. Portless exposes the web and WXT development
servers at instance-specific HTTPS `.localhost` URLs, and each server answers an identity probe
before SVC reports it as healthy. `pnpm dev` and `pnpm dev:webext` return after readiness; use
`pnpm dev:status` to inspect them and `pnpm dev:stop` for bounded cleanup.

The WXT capability builds and watches the extension without requiring a browser installation. To
also launch Chrome, set `INKCRE_CHROMIUM_BINARY` to an executable path before starting it; WXT then
uses `.runtime/dev/<instance>/chromium-profile` rather than a shared user profile.

The web application's PostgREST URL, client ID, and user-supplied JWT signing credential are
browser-local settings. No `VITE_*`, Cloudflare, or Worker path supplies that credential, and
portable config export excludes it.

The database capability starts digest-pinned pgvector, core-py, and PostgREST images under the
worktree's SVC identity, with collision-safe ports and volumes. It consumes the checked-in
core-py contract pin, runs core-py's ordered initialization, and waits for protocol readiness;
client-web owns no copied migration SQL, role bootstrap, seed ordering, or startup sleep.

`pnpm run doctor -- --json` reports the image digest, source revision, contract version, generated
type drift, config provenance, Docker availability, and legacy endpoint status without reading or
printing the browser-owned JWT credential.

## Package contract

`@inkcre/core` is an ESM-only library built by tsdown. Its published contract is
`dist/index.js` plus declarations and declaration maps. Vite and WXT applications alias
`@inkcre/core` to source during monorepo development, while package consumers resolve the built
`dist` entry.

Install the adopted SVC CLI in an isolated Python environment, then verify the repository integration:

```bash
python -m pip install sustainable-vibe-coding==10.0.1
svc status --json
```

Shared product truth is mounted read-only from `InKCre/docs` at `docs/_shared/`. Update the Hub first and publish its commit before changing this repository's submodule reference.
