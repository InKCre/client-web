# InKCre Web Client(s)

This is a monorepo of InKCre that includes client-web, client-webext and infrastructure of them.

## Development prerequisites

- Node.js `22.22.3` from `.node-version`
- pnpm `10.26.2` from the root `packageManager` field
- Python `3.11+` with `sustainable-vibe-coding==10.0.1`
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

## Canonical commands

Run repository-wide commands from the root:

```bash
pnpm run doctor      # Diagnose required versions and generated state
pnpm dev             # Start the web client
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

The required stable lane uses TypeScript 5.9 and Vue TSC. Unit and E2E participation join
`pnpm check` in the testing phase; no placeholder test pass is reported today.

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
