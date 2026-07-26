# @inkcre/client-web Development Guideline

## Commands

```bash
pnpm dev                                    # SVC + Portless web capability
pnpm dev:status                             # Read-only capability health
pnpm dev:stop                               # Current worktree cleanup
pnpm --filter @inkcre/client-web type-check  # Vue/TypeScript check
pnpm --filter @inkcre/client-web build       # Type-check and production build
```

Use `pnpm run doctor` before diagnosing machine setup and `pnpm check` for the repository-wide
required gate. `pnpm doctor` is pnpm's unrelated built-in command. Formatting and linting are owned
by the root Oxfmt/Oxlint configuration.

## Joint dev with extensions

Static Module Federation remotes are served from their declared `dist/client-web` output. When an
output is absent, the host starts the remote package's normal build in a separate process before
mounting it. The process boundary matters because Module Federation generates virtual modules
under package-local `node_modules`; nesting the build inside the running host Vite process can
cross-contaminate plugin state.

Use `pnpm dev:all` when actively editing remotes and the normal `pnpm dev` path when the built
remote is sufficient.

## Browser-local configuration

The settings page is the sole runtime authority for the PostgREST URL, client ID, and user-owned
JWT signing secret. A fresh origin has no default service or client identity. The secret is masked
and omitted from portable exports. Do not add a hardcoded endpoint, Vite environment variable,
Worker binding, or shared Cloudflare secret for runtime configuration.

## Joint dev with @inkcre/web-design

Keep the lockfile and trusted GitHub Packages installation contract reproducible. A local
`pnpm link` is not a supported repository state.
