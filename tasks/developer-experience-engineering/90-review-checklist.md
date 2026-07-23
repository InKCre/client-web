# Review Checklist

## Decisions for Sir

- [ ] D1: client-web is a static SPA; remove Hono/Worker and deploy Cloudflare Pages.
- [ ] D2: JWT signing remains browser-local with a user-supplied secret; Cloudflare and Vite never provide a shared secret.
- [ ] D2a: hard-cut web config to one browser-local authority instead of preserving localStorage/http/env adapter selection.
- [ ] D3: hard-cut formatting/linting to Oxfmt/Oxlint; use tsdown only for real libraries.
- [ ] D3a: stable TypeScript remains required; TS7 native preview is shadow-only.
- [ ] D4: core-py remains schema authority; client-web consumes a versioned Docker PostgREST development capability without copying migrations.
- [ ] D5: adopt official SVC `10.0.1` and settle the docs Hub before adding the client-web shared mount.
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

- Step 1 authorization covered the reproducibility contract: version metadata, install documentation, the Copilot setup workflow, one manifest cleanup, lock generation, dependency restore, and ignored generated build/check outputs.
- Outside that slice, no product source, Cloudflare, Docker, database, branch, submodule, sibling-repository, commit, push, or external-resource mutation is authorized.
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
