# Client Web Developer Experience Engineering

- **Objective**: establish a reproducible, static-first, agent-friendly development and delivery contract for the InKCre web monorepo. A fresh human or agent should be able to discover the repository contract, start an isolated local stack, run one complete verification command, test the web app and browser extension, and obtain production or per-PR Cloudflare deployments without hidden machine state.
- **Guardrails**: preserve intended product behavior; treat a user-supplied browser-local JWT secret as a deliberate client credential unless the product trust model changes; never turn that credential into a shared Cloudflare/build secret; keep database schema authority in `core-py`; keep PRD and Product TDD authority in `InKCre/docs`; use official SVC `10.0.1` rather than copied framework documents; isolate Hub edits, shared-reference bumps, and Spoke implementation; require explicit user authorization before any non-packet mutation.
- **Verification**: a clean checkout completes a frozen install; one root command checks every workspace package; Portless and SVC expose deterministic worktree-local capabilities; Docker PostgREST is backed by the authoritative schema; unit, web E2E, and Chromium extension E2E pass; each eligible PR gets a verified Cloudflare Pages preview; protected `main` deploys the exact accepted static artifact to production; no Cloudflare variable or public artifact contains a shared JWT signing credential; SVC and shared-doc freshness checks pass.
- **Current Truth**: client-web builds and runs as a static Vue SPA with no Hono, application Worker, Wrangler config, or runtime config endpoint. Web bootstrap config is validated and stored only in the browser origin; webext initializes the same core store from extension-owned storage. The user-supplied JWT signing credential is masked, never supplied through Vite or Cloudflare, and excluded from portable config exports. SVC 10.0.1 and Portless expose worktree-scoped `web`, `webext`, and database capabilities with exact instance probes and bounded cleanup. The database capability now consumes core-py's digest-pinned OCI runtime and versioned `inkcre` protocol contract; client-web does not own migrations, role SQL, seed ordering, or reset semantics. Generated relation types, profile/JWT drift checks, deterministic browser/database E2E, legacy endpoint migration, and trusted static Pages controllers are implemented locally. Phase 2 was committed as `6902293`, and the static runtime baseline as `5da90de`. See [evidence](./10-evidence.md).
- **Next Step**: publish the integrated branch, prove the full private-GHCR/database/browser chain in GitHub Actions, merge the protected-main hard cut, configure and smoke-test the secret-free Pages project, then retire long-lived `develop` and legacy staging control-plane state.

## Packet Map

- [10-evidence.md](./10-evidence.md) - observed repository, deployment, config, auth, and branch facts; no target claims.
- [20-decisions.md](./20-decisions.md) - candidate decisions, rationale, rejected alternatives, and revisit triggers.
- [30-target-contract.md](./30-target-contract.md) - desired command, toolchain, package, local-runtime, SVC, and knowledge contracts.
- [40-testing-delivery.md](./40-testing-delivery.md) - test pyramid and Cloudflare Pages preview/production lifecycles.
- [50-roadmap.md](./50-roadmap.md) - independently verifiable execution slices and exit proofs.
- [90-review-checklist.md](./90-review-checklist.md) - user decisions, hard cut-off boundary, exclusions, and decision log.

## Classification and Posture

- Input lenses: Constraint + Reality + Artifact.
- Active posture: Execute.
- The user authorized the cross-repository runtime contract, commits, delivery configuration,
  protected-main cutover, and legacy retirement through the tenth execution step.
- Execute returns to Diagnose if the pinned private image cannot be consumed without broadening
  package permissions or if provider state disagrees with the exact release identity.

## User-Confirmed Direction

- Evaluate Oxfmt, Oxlint, tsdown, and TypeScript 7.
- Provide production CD and one preview per pull request on Cloudflare.
- Adopt Portless, local Docker-based PostgREST, and E2E including the browser extension.
- Use `InKCre/docs` for PRD and Product TDD.
- Align with SVC v10.
- Prefer deliberate hard cut-offs over historical compatibility debt.
- Optimize for agent-friendly human-agent collaboration.

## Execution Status

- Phase 0 started on 2026-07-23.
- Step 1 was committed as `6245d77`.
- Completed locally: runtime/package-manager pin, lock tracking boundary, trusted npmrc boundary, Copilot setup version/auth wiring, removal of a direct Windows-only Rollup package, prerequisite documentation alignment, a regenerated six-importer lockfile, dependency restore, and frozen-install proof.
- GitHub CLI authentication was granted `read:packages`; a temporary trusted npmrc resolved `@inkcre/web-design` without persisting or printing the token.
- Baseline checks are captured. Client-web's static build succeeds; existing type, declaration, webext build/test, and Twitter extension build failures remain deliberately unfixed in this slice.
- Step 2 is complete. Official SVC 10.0.1 init/status is healthy and idempotent in client-web and `InKCre/docs`.
- The Hub migration was committed as `ad464fd` and pushed to `origin/codex/svc-v10-adoption`; copied v9 framework files are removed, generated v10 surfaces are healthy, and PRD/Product TDD are unchanged.
- Client-web now has `docs/_shared` fixed to published Hub commit `ad464fd` plus a thin repo-root discovery wrapper for the canonical Hub workflow.
- The client shared-reference introduction was committed separately as `e398afe`; the Spoke-local SVC/navigation changes are recorded in a follow-up commit. Client-web push remains gated.
- Step 3 was committed as `6902293`. It hard-cuts Prettier/Biome/ESLint/tsup surfaces, establishes root Oxfmt/Oxlint and explicit workspace/package validators, normalizes stable TypeScript 5.9 plus Vue TSC, adds green native TypeScript 7 and type-aware Oxlint shadow lanes, migrates `@inkcre/core` to an ESM-only tsdown contract, and repairs the stale package/API edges required for all workspace type checks and builds to pass.
- Phase 2 verification is green for `pnpm run doctor`, `pnpm format:check`, `pnpm lint`, `pnpm lint:type-aware`, `pnpm type-check`, `pnpm type-check:ts7`, `pnpm build`, and the root `pnpm check` contract. Frozen install proofs are refreshed before handoff.
- Step 4's static/config/SVC/Portless/WXT slice is committed and locally green.
- The core database capability is published as
  `ghcr.io/inkcre/core-py@sha256:2cd11e50eaaeb1832d00d36e3821ac748b7e4b80f549c62085157de8e9044289`
  from source revision `0a477db051665e0bb5a3faa888c9d9415cc084f8`.
- The client contract snapshot, generated relation types, `inkcre` PostgREST client, canonical
  production profile, JWT contract, local Compose lifecycle, doctor diagnostics, and browser
  E2E are implemented. Frozen install, `pnpm check`, and the high-severity dependency gate are
  green locally. GitHub-hosted CI pulled the exact private GHCR digest with repository-scoped
  Read access and proved the full PostgreSQL → init → core/PostgREST → built browser read/write/
  deny → deterministic reset → bounded cleanup chain.
- Pages delivery consumes only the exact successful `Client checks` artifact, revalidates
  current main or the exact eligible internal PR head before delivery, and gives every preview
  the collision-safe branch `preview/client-web/pr-N`.
