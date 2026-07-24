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

TODO

## Browser-local configuration

The settings page is the sole runtime authority for the PostgREST URL, client ID, and user-owned
JWT signing secret. The secret is masked and omitted from portable exports. Do not add a Vite
environment variable, Worker binding, or shared Cloudflare secret for it.

## Joint dev with @inkcre/web-design

Keep the lockfile and trusted GitHub Packages installation contract reproducible. A local
`pnpm link` is not a supported repository state.
