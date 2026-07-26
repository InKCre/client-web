# Evidence Snapshot

This file records observed facts only. Decisions and desired state live in adjacent packet files.

## Phase 0 Repository and Tooling Baseline

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
- Client-web now has schema-v2 `svc.json`, the generated Codex skill, bounded root/docs navigation, and the managed local-overlay ignore block from the official SVC 10.0.1 wheel. Official `svc status --json` reports healthy and repeated init reports `noop`.
- `docs/_shared` is a git submodule pointing to published Hub commit `ad464fd9bc9f6c9a8c316e5e75bc5f16e794ecd7`; `.gitmodules` uses `https://github.com/InKCre/docs.git` and does not float on a branch.
- `InKCre/docs` contains PRD and Product TDD. Its local `codex/svc-v10-adoption` branch now has an official, healthy SVC 10.0.1 adoption and removes the copied v9 framework projection while keeping InKCre-owned submodule operations/profile/skill.
- The Hub PRD and Product TDD trees have no diff in the v10 migration.
- The official SVC 10.0.1 wheel was installed in an isolated temporary environment; the dirty unreleased `../../svc` source worktree was not used as the adoption authority.
- `origin/main` is an ancestor of `origin/develop` and is 144 commits behind it.
- During audit, a failed frozen offline install recreated only ignored `node_modules`; tracked source stayed clean. After GitHub Packages access was restored, a real `pnpm install --frozen-lockfile` completed all six workspace projects and ran `wxt prepare`.
- pnpm 10 ignores environment-expanded credentials in repository-controlled npmrc files. The repository now keeps only the `@inkcre` registry mapping and requires trusted user/CI auth.
- Initial credentials returned HTTP 401/403 for `@inkcre/web-design`. After the user granted the active GitHub CLI identity `read:packages`, a trusted temporary npmrc generated the lock and restored dependencies; the temporary credential file was not part of the repository.

## SVC v10 and Shared-Docs Results

Validated on 2026-07-23 with an isolated Python environment containing the published `sustainable-vibe-coding==10.0.1` wheel; commands invoked that environment's exact `svc` binary rather than the dirty sibling SVC source tree or an assumed global executable.

| Repository    | Command                         | Result                                                    |
| ------------- | ------------------------------- | --------------------------------------------------------- |
| client-web    | `svc status --json`             | healthy; schema v2; adopted 10.0.1; wheel runtime current |
| client-web    | `svc init --agent codex --json` | `noop`; generated surfaces remain current                 |
| `InKCre/docs` | `svc status --json`             | healthy; schema v2; adopted 10.0.1; wheel runtime current |
| `InKCre/docs` | `svc init --agent codex --json` | `noop`; generated surfaces remain current                 |

- SVC v10 has no `_svc_v10.md`, `svc migrate`, or copied consumer corpus. Framework guidance remains in the installed distribution and is queried with `svc lookup`.
- The Hub retains `00-meta/submodule-profile.md`, `submodule-operations.md`, and `skills/edit-svc-shared-docs/**` because they are InKCre-specific operational owners rather than SVC framework copies.
- The removed v9 files remain recoverable from Git history. Existing Spokes continue to read their pinned old Hub commit until they deliberately adopt v10 and bump the shared reference.
- Hub commit `ad464fd` was pushed to `origin/codex/svc-v10-adoption` before client-web recorded the shared reference.
- The canonical Hub `check-submodule.sh --mode pre-commit` validates the client-web URL, clean submodule worktree, and remote reachability of the exact commit.

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

| Command                                               | Exit | Baseline result                                          |
| ----------------------------------------------------- | ---: | -------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                      |    0 | Six workspace projects restored; WXT prepare completed   |
| `pnpm install --frozen-lockfile --offline`            |    0 | Idempotent; lock hash unchanged                          |
| `pnpm type-check`                                     |    2 | Stops at three core extension/config errors              |
| `pnpm build`                                          |    1 | Core ESM emitted; declaration build hits the same errors |
| `pnpm --filter @inkcre/client-web build-only`         |    0 | Static SPA bundle succeeds with size warnings            |
| `pnpm --filter @inkcre/client-webext build`           |    1 | Cannot resolve `wxt/utils/storage` from core             |
| `pnpm --filter @inkcre/client-webext exec vitest run` |    1 | No test files found                                      |
| `pnpm --filter @inkcre/ext-twitter build`             |    1 | Cannot resolve `./Extension`                             |

## Phase 2 Toolchain and Package Results

Validated on 2026-07-23 with Node 22.22.3, pnpm 10.26.2, stable TypeScript 5.9.3, native
TypeScript 7.0.2, Oxfmt 0.60.0, Oxlint 1.75.0 paired with oxlint-tsgolint 7.0.2001, and
tsdown 0.22.13.

- One root Oxfmt configuration formats 337 tracked-source candidates and excludes the read-only
  `docs/_shared` mount plus the two SVC-managed navigation surfaces.
- One root Oxlint configuration enforces correctness and unused-variable errors without carrying
  the previous ESLint/Prettier or Biome configs. Type-aware Oxlint is a separate green shadow lane.
- The pnpm catalog pins stable TypeScript 5.9.3 and Vue TSC 3.3.8 for all workspaces. Native
  TypeScript 7.0.2 is root-only and checks the framework-independent core lane.
- The workspace validator accounts for all five declared members, their required scripts/builders,
  and the documented source-only exemption for `@inkcre/ext-dev-utils`.
- `@inkcre/core` builds ESM JavaScript, source maps, declarations, and declaration maps through
  tsdown. Its package manifest exposes only `dist/index.js`/`dist/index.d.ts`; no fictional CommonJS
  entry remains.
- Monorepo Vite/WXT consumers alias core source for development. The package validator separately
  proves the consumer workspace link, direct ESM import, built core dist contract, and required web,
  webext content-script, and Twitter remote outputs.
- The webext type/build path now uses declared AI provider dependencies, current core configuration
  APIs, and namespaced `@wxt-dev/storage` keys. LLM providers, default model, and explain
  instruction remain extension-local refs rather than an unpersisted remote client-config
  projection; their deep-write behavior has a focused passing regression test. Its Chromium
  production build succeeds.
- The Twitter remote uses the current extension module entry and builds successfully.
- Type-aware lint found and corrected a real `HeadersInit` array/object spread hazard in the core
  REST client.
- A direct client-web Vitest invocation remains outside the Phase 2 gate and is red: 5 tests pass,
  14 fail because the suite has no DOM test environment and two `useEither` assertions assume
  synchronous async-computed resolution; loading the application Vite config also triggers a
  failing ad hoc Twitter build. Phase 4 owns the hermetic test configuration and behavior repair.

Observed Phase 2 command outcomes:

| Command                                                                                          | Exit | Result                                                    |
| ------------------------------------------------------------------------------------------------ | ---: | --------------------------------------------------------- |
| `pnpm run doctor`                                                                                |    0 | Required Phase 2 setup healthy; Phase 3 capabilities warn |
| `pnpm format:check`                                                                              |    0 | 337 files match the Oxfmt contract                        |
| `pnpm lint`                                                                                      |    0 | Required correctness/unused gate is clean                 |
| `pnpm lint:type-aware`                                                                           |    0 | Shadow type-aware rules are clean                         |
| `pnpm type-check`                                                                                |    0 | All five workspace members participate and pass           |
| `pnpm type-check:ts7`                                                                            |    0 | Native TypeScript 7 core shadow is clean                  |
| `pnpm build`                                                                                     |    0 | Core, web, webext, and Twitter outputs build              |
| `pnpm check`                                                                                     |    0 | Required Phase 2 aggregate gate is clean                  |
| `pnpm --filter @inkcre/client-webext exec vitest run composables/useWebExtensionStorage.spec.ts` |    0 | Nested ref changes write extension-local serialized data  |
| `node scripts/check-package-contract.mjs`                                                        |    0 | Core ESM dist/declaration contract resolves               |

Builds retain non-fatal upstream/bundle warnings: ineffective dynamic imports in core, large web
and webext chunks, a Module Federation `eval`, VueUse pure annotations, duplicate UnoCSS import,
and Module Federation sourcemap notices. These are observable optimization debt, not hidden gate
failures.

The `run` keyword is required for the repository doctor because `pnpm doctor` is an unrelated pnpm
built-in command and does not dispatch package scripts.

## Phase 3 Static and Worktree Runtime Results

Validated on 2026-07-23 with official SVC 10.0.1, Portless 0.12.0, Node 22.22.3, and pnpm
10.26.2.

- Portless 0.15.4 requires Node 24 or newer. The repository therefore pins 0.12.0 exactly; that
  release supports Node 20 or newer and matches the already-running host proxy.
- Client-web no longer contains the Hono server, Wrangler manifest, Cloudflare environment files,
  Worker types, Hono dependency, or Wrangler dependency. Vite continues to produce only the static
  `dist` artifact.
- `packages/core` no longer exposes HTTP or Vite-environment config adapters. Web initializes the
  store from localStorage before mounting; webext initializes it from namespaced extension storage
  before mounting each entrypoint.
- The settings UI validates before save/import, masks the JWT credential, labels its local
  provenance, and exports only PostgREST URL plus client ID. Existing local credential state is
  retained during portable import.
- The local runtime contract fails on reintroduced Worker files/dependencies, `/api/config`,
  `VITE_INKCRE_JWT_SECRET`, public legacy adapter exports, fixed Chromium port 9222, missing
  worktree probes, or an unpinned Portless dependency.
- Initial SVC HTTP probes correctly rejected the shared Portless proxy's generic 404 as
  `occupied-unhealthy`. The final worktree-scoped exec probes include `${dev.instance}` in their
  endpoint identity and accept only an exact target/instance JSON response. Portless is invoked
  without `--force`, so an existing route is never silently taken over.
- Cold starts returned `started` for `web` and `webext`. A subsequent all-target status reported
  `healthy`; Portless listed independent routes for instance `4ac9df364b54706e`.
- The host has no discoverable Chrome installation. WXT now remains a healthy build/HMR capability
  with automatic browser launch disabled by default; an explicit `INKCRE_CHROMIUM_BINARY` enables
  launch with `.runtime/dev/<instance>/chromium-profile`.
- Bounded cleanup terminated only the two routes for the current SVC instance. The pre-existing
  `xiaoland` and `api.xiaoland` routes remained registered.
- With core, web, webext, and Twitter build-output directories temporarily moved aside and restored
  through a bounded trap, `pnpm type-check` still passed. The source/runtime check has no hidden
  dependency on a prior build; public artifact inspection remains correctly owned by the
  post-build package contract.
- `core-py` HEAD and GitHub main both resolve to `f8780239d9a4bab7ac80fd992cab459950ab34e5`. Its
  migrations are the schema authority, but its Compose stack has no PostgREST, portable
  authenticator/anonymous roles, deterministic seed, or reset capability. The worktree also has
  unrelated user-owned untracked state; no sibling-repository mutation was made.

Observed client-owned Phase 3 command outcomes:

| Command                 | Exit | Result                                                               |
| ----------------------- | ---: | -------------------------------------------------------------------- |
| `pnpm check:runtime`    |    0 | Static/browser-local and worktree target tripwires pass              |
| `svc status --json`     |    0 | Schema-v2 config is valid; adoption and generated surfaces current   |
| `pnpm dev`              |    0 | Worktree `web` capability cold-started and proved identity           |
| `pnpm dev:webext`       |    0 | Worktree WXT watcher cold-started without requiring local Chrome     |
| `svc dev status --json` |    0 | Both running targets were healthy                                    |
| `pnpm run doctor`       |    0 | Client runtime healthy; SVC PATH and Docker remain explicit warnings |
| `pnpm lint`             |    0 | Required lint lane is clean                                          |
| `pnpm lint:type-aware`  |    0 | Shadow type-aware lint lane is clean                                 |
| `pnpm type-check`       |    0 | Runtime contract and all five workspace type checks pass             |
| `pnpm type-check:ts7`   |    0 | Native TypeScript 7 core shadow is clean                             |
| `pnpm build`            |    0 | Static web, core, Chromium extension, and remote artifacts pass      |

Complete Phase 3 readiness remains unclaimed: no Docker engine is installed on this host, and the
authoritative PostgreSQL/PostgREST capability requires a separately authorized `core-py` change
before client-web can consume and verify it.

An independent read-only final review accepted the client-owned Step 4 diff after correcting an
initial mix-up between source-level `check:runtime` and post-build `check:package`. Remaining
non-blocking debt is the Unix-oriented `ps` ownership check in `dev:stop` and the absence of
Phase-4-owned lifecycle-script regression tests.

## 2026-07-26 Database Provider and SVC Follow-up

- PDM 2.27.0 owns the host's global project. Adding
  `sustainable-vibe-coding==10.0.1` with `pdm add -g --save-exact` made `svc` available on the
  existing PATH without installing the dirty sibling `../../svc` worktree.
- `svc --version` and `svc status . --json` report 10.0.1, wheel resource mode, a valid committed
  base, a valid ignored local overlay, and a healthy effective configuration.
- The tracked SVC declaration selects the portable `local` database provider. The ignored
  `svc.local.json` selects `ssh` on this host and owns its SSH alias, remote executable, and
  optional Portless port. No tracked file contains those machine facts.
- Local and SSH providers execute the same tracked Compose topology. SSH Compose commands are
  transported as a bounded tar payload to one validated SSH-config alias; neither shell
  interpolation nor `eval` reconstructs caller arguments.
- Remote services publish only remote-loopback dynamic ports. A worktree-owned OpenSSH control
  tunnel maps three independently allocated local-loopback ports to them. Runtime state records
  provider and port identity so a provider change is refused until explicit cleanup.
- Provider diagnostics proved the remote Docker engine at 28.5.2 and Compose
  2.40.3-desktop.1. The selected engine authenticated to the private GHCR package through
  stdin-based Docker login; no token entered repository state or command output.
- `pnpm db:ready`, guarded `pnpm db:reset`, and `pnpm dev:stop` passed against the SSH provider.
  Cleanup removed the exact Compose project, volume, local runtime credentials, and control
  tunnel.
- A concurrent isolation proof started two SSH-backed database identities. Their Compose projects,
  remote ports, local ports, volumes, and tunnels were distinct; stopping the first left the
  second healthy.
- `pnpm test:e2e` passed two built-browser/PostgREST cases after installing the lock-compatible
  Playwright Chromium: authenticated read/write and absent/wrong credential denial. The harness
  restored the deterministic baseline and removed its ephemeral remote project.
- `pnpm dev` passed with a non-privileged machine-local Portless port. The run exposed and repaired
  a pre-existing Module Federation development bug: static remotes now check and serve
  `dist/client-web`, and a missing remote builds in a separate process instead of nesting a second
  Module Federation build inside the host Vite process.
- Provider regression tests cover portable local defaulting, local Docker diagnosis, SSH option
  injection rejection, and proof that SSH diagnosis never invokes the local Docker CLI.

## 2026-07-26 Vitest, Browser E2E, CI, and Pages Follow-up

- A root Vitest 4 project graph now discovers four explicit projects: core, client-web,
  client-webext, and runtime scripts. The historical Node test uses Vitest instead of `node:test`;
  leaf packages delegate to the root runner rather than carrying independent Vitest versions.
- The client-web project owns its Vue transform, happy-dom environment, setup file, source aliases,
  and a bounded workaround for the published `@inkcre/web-design` package's invalid mixed exports
  map. Historical async assumptions, stale selectors, real-timer sleeps, and one hollow polling
  assertion were corrected.
- `pnpm test:unit` passes 27 tests across seven files: three core, nineteen client-web, one
  client-webext, and four provider/runtime tests.
- Playwright now has separate `web-database` and `browser-extension` projects. The extension
  project launches persistent Chromium with only the exact `.output/chrome-mv3` build enabled,
  obtains its runtime ID from the MV3 service worker, seeds extension-local non-production config,
  and proves the real popup UI.
- `pnpm test:e2e:web` passes the two authenticated/denied peer database browser cases through the
  SSH Docker provider. `pnpm test:e2e:webext` builds and loads the Chromium artifact and passes its
  popup case. The Firefox MV2 production build passes with upstream warnings for the future
  Mozilla data-collection declaration and a stable extension ID.
- Required CI now has independent workspace, peer-database, and browser-extension checks plus a
  non-blocking type-aware/TypeScript 7 shadow job. It retains Vitest/Playwright/database failure
  evidence and exact Chrome/Firefox artifacts. Every third-party Action reference is pinned to an
  immutable commit SHA.
- Dependabot, CODEOWNERS, and a PR evidence/risk template are present locally. Pages deployment now
  checks Wrangler's deployment ID/URL and smoke-tests both the root and SPA fallback.
- `pnpm check`, `pnpm lint:type-aware`, `pnpm type-check:ts7`, both E2E projects, the Firefox build,
  YAML parsing, frozen lock verification, and `git diff --check` pass locally.
- The host has no global `wrangler` executable on PATH, but the pinned `pnpm dlx
wrangler@4.114.0` invocation has a healthy OAuth session with Pages write access.
- GitHub CLI is authenticated as `xiaoland`, whose active `InKCre` organization membership role is
  `admin`. Organization secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, plus the
  `CLOUDFLARE_PAGES_PROJECT=inkcre-client-web` variable, are selected only for
  `InKCre/client-web`. Secret values remain unreadable and their deployment capability is unproven
  until the workflow runs.
- Cloudflare Pages Direct Upload project `inkcre-client-web` exists with production branch `main`.
  Its default domain is `inkcre-client-web.pages.dev`; custom domain `app.inkcre.dev`, its proxied
  CNAME, DNS ownership verification, and TLS/HTTP validation are active. The project has no
  canonical deployment yet.
- The local `pnpm audit --audit-level high` call still receives gzip bytes where pnpm expects JSON.
  This is a host/network response issue; the same unchanged audit gate passed in the latest GitHub
  Actions run and remains required.
