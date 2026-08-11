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

The settings page is the sole runtime authority for the PostgREST URL, Extension Registry URL,
client ID, and user-owned JWT signing secret. A fresh origin has no default service or client
identity. The secret is masked and omitted from portable exports. Do not add a hardcoded endpoint,
Vite environment variable, Worker binding, or shared Cloudflare secret for runtime configuration.

## Joint dev with @inkcre/ui-web

The default `pnpm dev`, `pnpm check`, build, and CI paths consume the exact
GitHub Packages version in `package.json` and `pnpm-lock.yaml`. Keep this
registry lane green. A local `pnpm link`, `file:`, workspace member, manifest
edit, or lockfile edit is not a supported UI development state.

Use the optional source lane when changing `@inkcre/ui-web` and this client
together. Install both repositories first, generate UI tokens after changing
`tokens/inkcre.tokens.json`, then start from the client repository root:

```bash
pnpm --dir ../ui install --frozen-lockfile
pnpm --dir ../ui generate
pnpm dev:ui --ui-source ../ui/packages/web
```

Replace `../ui` with the actual checkout location when the UI repository
directory has not yet been renamed or is stored elsewhere.

`--ui-source` is resolved for the current command and validated as an
`@inkcre/ui-web` package with every public source entry present. The resolved
machine path is never written to tracked configuration. An absolute
`INKCRE_UI_SOURCE_ROOT` environment value is also accepted for tooling that
cannot pass CLI arguments.

The command starts the separate worktree-scoped SVC `web-ui` capability and
prints a `NON-RELEASE` banner with the resolved package root. Only source mode:

- aliases the exact root, styles, functions, mixins, token, utility, locale,
  and UnoCSS specifiers;
- lets Vite serve and watch the validated package root while retaining the
  detected client workspace root;
- resolves Vue and UI peer imports from the consumer installation;
- injects client Sass only into client-owned files and UI Sass only into
  UI-owned files.

Use the remote-aware command when editing the Twitter Module Federation remote
in the same loop:

```bash
pnpm dev:all:ui --ui-source ../ui/packages/web
```

Check the consumer and UI source type graph without persisting an absolute
path:

```bash
pnpm type-check:ui --ui-source ../ui/packages/web
```

This command writes its tsconfig under ignored `.runtime/ui-source/`, maps the
same exact public entries and consumer-owned peer packages, runs Vue TSC, and
removes the temporary config. Keep the UI package's own type checker running
while editing UI internals:

```bash
pnpm --dir ../ui --filter @inkcre/ui-web exec vue-tsc \
  --noEmit --project tsconfig.check.json --watch
```

Run `pnpm dev:stop` to stop the current worktree's normal, source, extension,
and client-owned database capabilities. Stop before selecting a different UI
checkout. If Portless cannot start HTTPS without a TTY, use the unprivileged
proxy/override documented in the root README.

The overlay intentionally rejects `vite build`. Before handoff, stop source
mode, unset `INKCRE_UI_SOURCE_ROOT`, and run the normal `pnpm check`. A green
source loop is never evidence that the packed or published UI artifact is
complete.
