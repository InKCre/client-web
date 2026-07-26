# InKCre Web Client(s)

This is a monorepo of InKCre that includes client-web, client-webext and infrastructure of them.

## Development prerequisites

- Node.js `22.22.3` from `.node-version`
- pnpm `11.11.0` from the root `packageManager` field
- Python `3.11+`, PDM, and `sustainable-vibe-coding==10.0.1`
- Docker with Compose v2, either local or reachable through an SSH config alias
- A GitHub token with `read:packages` access to `@inkcre/web-design`

pnpm ignores authentication credentials declared by repository-controlled npm configuration. Store the environment-variable placeholder in the trusted user configuration:

```bash
pnpm config set --global //npm.pkg.github.com/:_authToken '${NODE_AUTH_TOKEN}'
```

The single quotes are intentional: they keep the token itself out of the command arguments and write the literal placeholder. pnpm expands it from the environment when it reads the trusted user configuration.

Install every workspace package from the repository root:

```bash
pdm add -g --save-exact sustainable-vibe-coding==10.0.1
git submodule update --init --recursive
pnpm install --frozen-lockfile
svc status .
```

The database capability pulls core-py's private digest-pinned runtime from GHCR. Authenticate the
selected Docker engine once with a GitHub token that has `read:packages`:

```bash
gh auth refresh -h github.com -s read:packages
gh auth token | docker login ghcr.io --username YOUR_GITHUB_USERNAME --password-stdin
```

The committed configuration uses local Docker. A machine that delegates Docker through SSH can
select the `ssh` provider in ignored `svc.local.json`:

```json
{
  "dev": {
    "profiles": {
      "local": {
        "targets": {
          "database": {
            "provision": {
              "env": {
                "INKCRE_DATABASE_PROVIDER": "ssh",
                "INKCRE_DATABASE_SSH_TARGET": "docker-host",
                "INKCRE_DATABASE_SSH_DOCKER_BIN": "docker"
              }
            }
          }
        }
      }
    }
  }
}
```

`INKCRE_DATABASE_SSH_TARGET` is one alias from the user's SSH config; repository files never own a
hostname, username, key path, or remote Docker path. The optional
`INKCRE_DATABASE_SSH_FORWARD_HOST` defaults to remote loopback.

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

Portless normally uses HTTPS port 443. On a host where an unattended agent cannot perform the
first-time sudo setup, machine-local SVC overrides may set `PORTLESS_PORT` in the `web` and
`webext` provision environments and replace their `access` URLs with the same unprivileged port.
The identity probe discovers the registered route instead of assuming port 443.

The WXT capability builds and watches the extension without requiring a browser installation. To
also launch Chrome, set `INKCRE_CHROMIUM_BINARY` to an executable path before starting it; WXT then
uses `.runtime/dev/<instance>/chromium-profile` rather than a shared user profile.

The web application's PostgREST URL, client ID, and user-supplied JWT signing credential are
browser-local settings. No `VITE_*`, Cloudflare, or Worker path supplies that credential, and
portable config export excludes it.

The database capability starts digest-pinned pgvector, core-py, and PostgREST images under the
worktree's SVC identity, with collision-safe ports and volumes. Local Docker publishes directly to
loopback. The SSH provider allocates ports on the remote engine and exposes them through an
instance-owned OpenSSH control tunnel, while callers still consume loopback URLs. Both providers
run the same tracked Compose definition and core-py initialization contract. Client-web owns no
copied migration SQL, role bootstrap, seed ordering, or startup sleep.

On a machine where core-py owns the active development stack, ignored `svc.local.json` may select
`INKCRE_DATABASE_PROVIDER=external` plus the absolute core-py `runtime.json` descriptor. The
attachment accepts only a development descriptor owned by `InKCre/core-py` whose runtime instance,
Compose project, Docker daemon ID, contract revision, migration head, source fingerprint, and live
readiness agree. Client-web does not stop or reset that shared runtime. Browser E2E still creates
and removes its own isolated database instance.

`pnpm run doctor -- --json` reports the image digest, source revision, contract version, generated
type drift, config provenance, Docker availability, and legacy endpoint status without reading or
printing the browser-owned JWT credential.

## Package contract

`@inkcre/core` is an ESM-only library built by tsdown. Its published contract is
`dist/index.js` plus declarations and declaration maps. Vite and WXT applications alias
`@inkcre/core` to source during monorepo development, while package consumers resolve the built
`dist` entry.

Shared product truth is mounted read-only from `InKCre/docs` at `docs/_shared/`. Update the Hub first and publish its commit before changing this repository's submodule reference.
