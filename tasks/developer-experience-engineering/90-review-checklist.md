# Review Checklist

## Decisions for Sir

- [x] D1: client-web is a static SPA; remove Hono/Worker and deploy Cloudflare Pages.
- [x] D2: JWT signing remains browser-local with a user-supplied secret; Cloudflare and Vite never provide a shared secret.
- [x] D2a: hard-cut web config to one browser-local authority instead of preserving localStorage/http/env adapter selection.
- [x] D3: hard-cut formatting/linting to Oxfmt/Oxlint; use tsdown only for real libraries.
- [x] D3a: stable TypeScript remains required; TS7 native is shadow-only.
- [x] D4: core-py remains schema authority; client-web consumes a versioned Docker PostgREST development capability without copying migrations.
- [x] D5: adopt official SVC `10.0.1`, publish the settled docs Hub, then add the exact published commit as the client-web shared mount.
- [ ] D6: fast-forward and protect `main`, then retire long-lived `develop`.

## Hard Cut-Off Boundary

- ignored/stale lockfile -> committed lock and frozen install;
- partial recursive scripts -> explicit complete workspace contract;
- Prettier + Biome formatting -> Oxfmt;
- ESLint + Biome linting -> Oxlint, except a proven named gap;
- mixed stable TypeScript versions -> one stable version plus non-blocking TS7 shadow;
- tsup/incoherent core exports -> tsdown ESM/declaration contract;
- Worker/Hono runtime config -> static Pages and browser-local config, if D1/D2 are confirmed;
- optional adapters with un-restored provenance -> one deliberate config authority;
- implicit/fixed ports and browser profiles -> Portless/SVC worktree identity;
- ad hoc external PostgREST -> pinned, health-checked capability backed by core-py migrations;
- copied SVC v9 framework docs -> packaged SVC v10 plus Consumer-owned knowledge;
- stale `main` plus effective `develop` -> protected `main` as sole integration/production branch;
- documentation claims without executable evidence -> commands, tests, CI, and current Deployment docs.

No compatibility shim, duplicate schema, dual formatter, alternate production branch, shared JWT deployment secret, or silent script exemption survives without a named consumer and removal criterion.

## Authorization Boundary

- Step 1 authorization covered the reproducibility contract and its isolated commit.
- Step 2 authorization covers client-web SVC adoption and shared-reference integration plus the `InKCre/docs` v10 Hub migration. The user separately authorized the isolated Hub commit/push and the two isolated client-web commits; client-web push remains unauthorized.
- Step 3 authorization covered the client-web toolchain/package-contract hard cut and the code
  repairs necessary to make that contract truthful. The user later authorized its isolated commit,
  recorded as `6902293`; no push was authorized.
- Step 4 authorization covers the client-web static/config/SVC/Portless/WXT/database
  implementation. The user separately arranged the authoritative `core-py` work and instructed
  client-web to consume and verify its result without modifying that sibling.
- On 2026-07-26 the user explicitly started the generic SSH Docker Provider and PDM-global SVC
  repair. This authorizes local provider implementation and verification, not commit or push.
- Outside those slices, no Cloudflare, branch, submodule, sibling-repository commit/push, or
  external publication is authorized.
- No production credential inspection.
- No server-issued auth/BFF redesign without separate product intent.
- No copied core-py migrations or SVC framework corpus.
- No task-runner platform, preview database automation, or broad browser matrix before the baseline is green.

## Decision Log

- 2026-07-23: opened as Constraint + Reality + Artifact; packet work is the only authorized mutation.
- 2026-07-23: chose a Spoke-local poly-file packet; supporting files split evidence, decisions, target, delivery, roadmap, and review.
- 2026-07-23: corrected the initial claim that client-web was materially a Worker app. It is a static SPA with a thin Hono config wrapper.
- 2026-07-23: corrected the initial security classification. Browser-local JWT signing is current product design; only shared build/Cloudflare credential distribution is rejected without new intent.
- 2026-07-23: Pages is now the recommended deployment target if Hono/runtime config is hard-cut.
- 2026-07-23: current evidence keeps TypeScript 7 native preview outside required CI.
- 2026-07-23: current evidence rejects client-owned copies of database migrations.
- 2026-07-23: user explicitly started Phase 0 reproducibility work.
- 2026-07-23: pnpm's trusted-auth boundary was corrected; lock generation was temporarily paused because the available GitHub credentials could not read `@inkcre/web-design`.
- 2026-07-23: user granted the active GitHub CLI identity `read:packages`; all six importers were locked, frozen installation succeeded, and actual baseline failures were recorded without expanding the slice into code repair.
- 2026-07-23: user authorized and created the isolated Step 1 commit `6245d77`, then explicitly started Step 2.
- 2026-07-23: client-web and the docs Hub adopted official wheel SVC 10.0.1 with healthy, idempotent generated surfaces.
- 2026-07-23: the local docs Hub branch hard-cut copied v9 framework documents while preserving PRD, Product TDD, and InKCre-owned shared-reference operations. Publication remains gated.
- 2026-07-23: user authorized the isolated Hub commit/push; `ad464fd` was pushed to `origin/codex/svc-v10-adoption`.
- 2026-07-23: client-web added `docs/_shared` at exact published commit `ad464fd` and a thin canonical-skill wrapper, with the shared ref staged separately from Spoke-local SVC changes.
- 2026-07-23: user authorized two isolated client-web commits; shared-reference introduction was recorded as `e398afe`, followed separately by the Spoke-local SVC/navigation changes.
- 2026-07-23: user explicitly started Step 3.
- 2026-07-23: Phase 2 hard-cut formatting/linting to Oxfmt/Oxlint, migrated core from tsup to
  ESM-only tsdown output, normalized the stable TypeScript/Vue TSC lane, and added native
  TypeScript 7 plus type-aware Oxlint shadows.
- 2026-07-23: all five workspaces now pass the explicit stable type/build contract; both shadow
  lanes are also green. Unit/E2E participation remains Phase 4 rather than a fake Phase 2 pass.
- 2026-07-23: user authorized the Step 3 commit; the isolated toolchain/package contract was
  recorded as `6902293`, then the user explicitly started Step 4.
- 2026-07-23: Step 4 accepted D1/D2/D2a, removed the Worker/Hono/runtime adapter surfaces, made web
  and webext config ownership explicit, and added worktree-scoped SVC/Portless capabilities.
- 2026-07-23: a cold-start probe initially exposed Portless's shared-proxy 404 as an SVC
  occupied-unhealthy conflict. The final executable identity probe treats an unregistered route as
  absent while Portless still refuses route takeover without `--force`.
- 2026-07-23: `core-py` is confirmed as the migration/role/seed/reset owner. Its worktree already
  contains unrelated user-owned untracked files, and no modification or publication was made
  without separate authorization.
- 2026-07-26: the committed database default remains local Docker; ignored machine-local SVC
  configuration selects one SSH-config alias and remote Docker executable without leaking host
  facts into Git.
- 2026-07-26: PDM global now pins the published SVC 10.0.1 wheel, and both base and effective
  project configuration report healthy.
- 2026-07-26: real SSH-backed readiness, reset, built-browser E2E, two-instance isolation, and
  bounded cleanup passed. The same run repaired the static remote cold-build boundary exposed by
  `pnpm dev`.
