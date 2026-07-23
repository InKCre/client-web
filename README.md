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

Install the adopted SVC CLI in an isolated Python environment, then verify the repository integration:

```bash
python -m pip install sustainable-vibe-coding==10.0.1
svc status --json
```

Shared product truth is mounted read-only from `InKCre/docs` at `docs/_shared/`. Update the Hub first and publish its commit before changing this repository's submodule reference.
