# @inkcre/client-web Development Guideline

## Commands

```bash
pnpm --filter @inkcre/client-web dev         # Dev server
pnpm --filter @inkcre/client-web type-check  # Vue/TypeScript check
pnpm --filter @inkcre/client-web build       # Type-check and production build
```

Use `pnpm run doctor` before diagnosing machine setup and `pnpm check` for the repository-wide
required gate. `pnpm doctor` is pnpm's unrelated built-in command. Formatting and linting are owned
by the root Oxfmt/Oxlint configuration.

## Joint dev with extensions

TODO

## Joint dev with @inkcre/web-design

```bash
cd /path/to/local/web-design
pnpm link --global
```

```bash
cd /client-web/apps/client-web
pnpm link --global @inkcre/web-design
```
