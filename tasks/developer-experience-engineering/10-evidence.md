# Evidence Snapshot

This file records observed facts only. Decisions and desired state live in adjacent packet files.

## Repository and Tooling

- Root scripts expose only `dev`, partial builds, and recursive `type-check`; there is no root lint, format check, test, check, doctor, or CI contract: `package.json:10`.
- Root `type-check` silently omits the web extension because it uses `typecheck`; the Twitter extension has no type-check script: `apps/client-webext/package.json:7`, `extensions/twitter/package.json:6`.
- Root `build` covers core and client-web. `build:all` adds Module Federation extensions but still omits client-webext: `package.json:13`.
- Formatting and linting are split across core ESLint/Prettier, webext Biome, and no client-web configuration: `packages/core/package.json:23`, `apps/client-webext/package.json:18`, `apps/client-web/package.json:6`.
- Baseline before Phase 0: `.gitignore` excluded `pnpm-lock.yaml`; the ignored lock was stale, and a frozen install reported `ERR_PNPM_OUTDATED_LOCKFILE`. Phase 0 removed that ignore rule and regenerated lockfile v9 with importers for the root and all five declared workspace packages.
- `@inkcre/core` mixes source and build exports and declares `dist/index.cjs`, while its current build is ESM-only: `packages/core/package.json:5`, `packages/core/tsup.config.ts:3`.
- Webext directly declared the Windows-only `@rollup/rollup-win32-x64-msvc` package even though Rollup already owns platform binaries as optional dependencies and no source imports it. Phase 0 removed that direct declaration before lock regeneration.
- Only the three client-web `*.spec.ts` files are present. Client-web has no test script or Vitest config.
- Webext has Vitest scripts/config, but the config references a missing `tests/setup.ts`: `apps/client-webext/vitest.config.ts:4`.
- No Playwright, Cypress, or Nightwatch E2E implementation exists.
- The only GitHub workflow prepares Copilot; it is not application CI or CD: `.github/workflows/copilot-setup-steps.yml:1`.

## Static Application and Hono Wrapper

- `vite build` produces the Vue application as static assets under `dist`: `apps/client-web/package.json:7`, `apps/client-web/vite.config.ts:25`.
- Vue Router uses history mode, so static hosting needs SPA deep-link fallback: `apps/client-web/src/router.ts:13`.
- Current deployment uses Cloudflare Workers with Static Assets because Wrangler declares `main: server/index.ts` and an `ASSETS` binding for `dist`: `apps/client-web/wrangler.jsonc:3`.
- Hono has only these responsibilities:
  - `GET /api/config` returns four Worker environment values.
  - `POST /api/config` returns success but does not persist anything.
  - the catch-all delegates to `ASSETS.fetch`.
  - Evidence: `apps/client-web/server/index.ts:13`.
- Wrangler already declares `not_found_handling: single-page-application`; static hosting can own asset serving and deep-link fallback without the Hono catch-all: `apps/client-web/wrangler.jsonc:11`.
- Therefore the product surface is a static SPA currently wrapped by a thin Worker. Removing Hono requires replacing or deleting only its runtime config endpoint; PostgREST and core remain external services.

## Configuration and JWT Data Flow

- `MetaConfig` contains `INKCRE_PGREST_URL`, `INKCRE_JWT_SECRET`, and `INKCRE_CLIENT_ID`: `packages/core/src/config/schema.ts:33`.
- The default meta adapter is `envAdapter`. Client-web sets it to the same adapter in development and does not automatically select `httpAdapter`: `packages/core/src/config/store.ts:16`, `apps/client-web/src/core.ts:139`.
- The settings page lets a user manually select `localStorage`, `http`, or `env`: `apps/client-web/src/views/settings/settings.vue:42`.
- The selected adapter name is written to `inkcre_config_adapter`, but no current code restores that choice on reload: `apps/client-web/src/views/settings/settings.vue:59`.
- `localStorageAdapter` writes the complete meta config as JSON under `inkcre_app_config`, including the JWT secret: `packages/core/src/config/adapters.ts:8`.
- `httpAdapter` fetches `/api/config`; it is used only when selected. The Worker response includes `INKCRE_JWT_SECRET` if that Worker binding is non-empty: `packages/core/src/config/adapters.ts:38`, `apps/client-web/server/index.ts:14`.
- `envAdapter` reads every `VITE_*` value and removes the prefix. A `VITE_INKCRE_JWT_SECRET` value is therefore compiled into browser-visible JavaScript: `packages/core/src/config/adapters.ts:81`, `apps/client-web/.env.example:1`.
- The settings export function writes the complete meta config, including its credential, to a JSON download: `apps/client-web/src/views/settings/settings.vue:104`.
- The browser uses the configured secret to sign an HS256 token with role `authenticated`, 24-hour expiry, issuer/audience `inkcre-client`: `packages/core/src/auth/store.ts:12`.
- The generated token remains in memory. PostgREST and core requests receive it as `Authorization: Bearer`; the secret itself is not sent to PostgREST: `packages/core/src/base/db-api.ts:41`, `packages/core/src/client/client.ts:121`.
- Webext contains an intended extension-storage adapter path, but its calls no longer match the current core store API, so its current runtime behavior is not proven: `apps/client-webext/logic/storage.ts:35`, `packages/core/src/config/store.ts:48`.

## Confirmed and Conditional Security Facts

- Confirmed:
  - the current design gives the browser JWT signing authority;
  - localStorage and config export can persist the user-entered secret in plaintext;
  - a `VITE_*` secret would be public in the built artifact;
  - a non-empty Worker secret would be returned through `/api/config` when the HTTP adapter is selected.
- Not confirmed:
  - no repository evidence proves the deployed Worker has a non-empty JWT secret;
  - Wrangler's checked-in value is empty, and `.env.cloudflare` does not define it;
  - the default adapter does not automatically call `/api/config`.
- Conditional risk:
  - if one shared Cloudflare secret is also PostgREST's HS256 verification key, every visitor who selects the HTTP adapter can mint the same `authenticated` role;
  - if each user supplies a secret for a PostgREST instance they control, browser-local signing is a deliberate local-first trust model rather than a server-secret leak;
  - XSS, privileged extensions, profile access, and exported config files remain credential-exposure surfaces under the local-first model.

## Local Runtime, Docs, and Branches

- Client Vite uses an implicit port and `host: true`; joint extension dev allocates from 4000; WXT fixes Chromium debugging to 9222.
- There is no Docker/Compose/PostgreSQL/PostgREST/schema/seed/readiness implementation in client-web.
- Sibling `core-py` owns migrations and has a PostgreSQL Compose service, but no PostgREST service.
- Client-web has no `svc.json`, SVC skill, `docs/_shared`, or task-retention instruction.
- An official SVC `10.0.1` init dry-run is ready; no apply occurred.
- `InKCre/docs` contains PRD and Product TDD but its local worktree currently carries a copied SVC v9.8 projection on a feature branch.
- `origin/main` is an ancestor of `origin/develop` and is 144 commits behind it.
- During audit, a failed frozen offline install recreated only ignored `node_modules`; tracked source stayed clean. After GitHub Packages access was restored, a real `pnpm install --frozen-lockfile` completed all six workspace projects and ran `wxt prepare`.
- pnpm 10 ignores environment-expanded credentials in repository-controlled npmrc files. The repository now keeps only the `@inkcre` registry mapping and requires trusted user/CI auth.
- Initial credentials returned HTTP 401/403 for `@inkcre/web-design`. After the user granted the active GitHub CLI identity `read:packages`, a trusted temporary npmrc generated the lock and restored dependencies; the temporary credential file was not part of the repository.

## Restored Baseline Results

- `pnpm install --frozen-lockfile` succeeds and generates `apps/client-webext/.wxt/tsconfig.json` through the required WXT postinstall.
- A second `pnpm install --frozen-lockfile --offline` succeeds with the lock hash unchanged at `e12ed478955da4caef9e64db39fded8c58596d413b60cc60aff1ff8456a0aeb0`.
- The Copilot setup workflow is structurally validated and uses setup-node's trusted npmrc plus a step-scoped `NODE_AUTH_TOKEN`. A real GitHub Actions run remains unproven until these uncommitted changes are intentionally published.
- Dependency resolution reports four existing peer mismatches: Module Federation runtime tools, Cloudflare Workers types, Zod 3 versus 4, and WXT's Vue plugin expecting Vite 5-7 while the lock resolves Vite 8 for that peer path.
- pnpm reports ignored lifecycle scripts for Parcel watcher, two esbuild versions, Sharp, and Workerd. The directly exercised client-web static build still succeeds; future commands must prove whether any ignored script needs explicit approval before expanding `onlyBuiltDependencies`.
- Root `pnpm type-check` and `pnpm build` both stop on the same three `packages/core/src/extension/base.ts` errors; the build emits ESM JavaScript before declaration generation fails.
- Targeted client-web type checking exposes stale/missing core exports and the same core config-store errors. Its direct `vite build` succeeds, producing a static bundle with a roughly 2.13 MB main chunk and size warnings.
- `packages/ext-dev-utils` type checking fails because it consumes core source outside its TypeScript project file list, plus stale core API types.
- Webext `vue-tsc` fails on stale core APIs and four undeclared AI SDK packages. Vitest finds no tests. Its Chromium build cannot resolve `wxt/utils/storage` imported from core.
- The Twitter extension build cannot resolve `./Extension` from `src/main.ts`.

Observed command outcomes on Node 22.22.3 and pnpm 10.26.2:

| Command | Exit | Baseline result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | Six workspace projects restored; WXT prepare completed |
| `pnpm install --frozen-lockfile --offline` | 0 | Idempotent; lock hash unchanged |
| `pnpm type-check` | 2 | Stops at three core extension/config errors |
| `pnpm build` | 1 | Core ESM emitted; declaration build hits the same errors |
| `pnpm --filter @inkcre/client-web build-only` | 0 | Static SPA bundle succeeds with size warnings |
| `pnpm --filter @inkcre/client-webext build` | 1 | Cannot resolve `wxt/utils/storage` from core |
| `pnpm --filter @inkcre/client-webext exec vitest run` | 1 | No test files found |
| `pnpm --filter @inkcre/ext-twitter build` | 1 | Cannot resolve `./Extension` |
