# Phased Roadmap

## Phase 0 - Solidify the Baseline and Trust Model

- Confirm static Pages versus Worker/Hono.
- Confirm browser-local JWT signing as intended product authority.
- Decide whether to hard-cut config adapters to local storage or preserve an explicit choice.
- Stop ignoring the pnpm lock, regenerate it from reviewed manifests, restore dependencies, and prove a clean frozen install.
- Run checks from the restored environment and record actual baseline failures.
- Confirm the exact `main`/`develop` ancestry and cutover procedure without executing it.

Exit proof:

- static/runtime ownership is explicit;
- JWT credential provenance and forbidden shared-secret paths are explicit;
- clean frozen install succeeds;
- baseline failures are reproducible rather than inferred from a broken dependency directory.

## Phase 1 - Adopt SVC v10 and Hub/Spoke Ownership

- Adopt official SVC `10.0.1` in client-web.
- Open a separate Hub task to classify and adopt v10 in `InKCre/docs`.
- Remove copied SVC framework authority while preserving admitted InKCre-owned knowledge.
- Settle Hub main and shared-reference transport.
- Add task retention, owner navigation, and freshness checks.

Exit proof:

- `svc status` is healthy;
- Hub and Spoke have one owner per durable claim;
- the shared reference is clean, reachable, and current;
- root instructions route agents to executable commands and true owners.

## Phase 2 - Establish One Toolchain and Package Contract

Status: complete and committed as `6902293` on 2026-07-23; push remains separately authorized.

- Add root Oxfmt/Oxlint and review migration baselines.
- Normalize stable TypeScript and workspace script names.
- Add TS7 native preview as a shadow check.
- Migrate `@inkcre/core` from tsup to tsdown and repair exports.
- Add canonical root commands and workspace-participation validation.
- Remove superseded configs/dependencies in the same verified cut.

Exit proof:

- `pnpm run doctor`, `pnpm check`, and `pnpm build` pass;
- every workspace member is accounted for by `scripts/check-workspace-contract.mjs`;
- no dual formatter/linter/library builder remains;
- stable TypeScript 5.9 is required while green native TypeScript 7 and type-aware Oxlint results
  remain separate shadow lanes;
- `scripts/check-package-contract.mjs` proves the ESM-only core dist/declaration contract.

## Phase 3 - Make Static and Local Runtime Deterministic

Status: complete locally. The client static/runtime slice was implemented on 2026-07-23; the
published core-py contract and provider-neutral database integration were verified on 2026-07-26.

- Remove Hono, Worker config, and `httpAdapter` if D1/D2 are confirmed.
- Make local/browser config authority explicit and restore it correctly on reload.
- Add Portless worktree URLs and SVC capabilities.
- Remove fixed/shared browser debug profiles and ports.
- Deliver pinned PostgreSQL/PostgREST with core-py-owned migrations, roles, test credential, seed, reset, and health.
- Document local state, logs, and cleanup.

Exit proof:

- two worktrees run concurrently without URL, port, profile, or data collision;
- client-web runs as a static Vite SPA;
- unhealthy occupied capabilities are reported rather than taken over;
- no local path reaches production implicitly;
- complete local readiness is machine-verifiable.

Current proof:

- static Vite build and public-artifact tripwires pass;
- browser-local and extension-local config initialization passes type/build checks;
- SVC reports the started worktree target healthy after cold start;
- bounded cleanup removes only the current worktree routes and preserves unrelated Portless routes;
- local and SSH transports share one tracked Compose/runtime contract, while machine facts remain
  ignored;
- real remote Docker/PostgREST readiness, reset, browser E2E, and cleanup pass;
- two simultaneous SSH-backed instances have distinct projects, local/remote ports, volumes, and
  tunnels; stopping one preserves the other.

## Phase 4 - Build the Test Pyramid

- Make existing web tests executable and hermetic.
- Repair WXT unit-test integration.
- Add core/package/config contract tests.
- Add Playwright web, Chromium extension, and integrated E2E.
- Add deterministic seed/reset and secret-safe artifacts.
- Add Firefox build/manifest smoke.

Exit proof:

- unit and E2E commands pass twice from a clean seeded environment;
- extension E2E uses the exact CI output;
- failures retain useful bounded evidence;
- tests cannot use production origins or shared credentials.

## Phase 5 - Add CI and Cloudflare Pages CD

- Add required PR checks, concurrency, and lock-keyed caches.
- Deploy eligible PRs to Pages and publish deployment status.
- Add fork policy and deployed static smoke.
- Verify and fast-forward/cut over `main`; protect it and retire long-lived `develop`.
- Add protected production deploy, deployment evidence, smoke, and rollback.

Exit proof:

- an internal PR creates and updates a verified preview;
- a fork PR cannot obtain credentials;
- failed checks cannot deploy production;
- the accepted commit maps to one artifact digest and Pages deployment.

## Phase 6 - Hard-Cut Legacy Surfaces and Ratchet

- Delete obsolete Worker/Hono, adapter, formatter, linter, build, environment, port, branch, and documentation surfaces.
- Add permanent tripwires for workspace participation, public build values, SVC/shared-doc freshness, and production-origin use in tests.
- Refresh admitted AGENTS, Unit TDD, Deployment, PRD, and Product TDD owners with verified truth only.
- Delete this packet under the v10 retention rule after work and durable updates are complete.
