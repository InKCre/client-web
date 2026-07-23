# Client Web Developer Experience Engineering

- **Objective**: establish a reproducible, static-first, agent-friendly development and delivery contract for the InKCre web monorepo. A fresh human or agent should be able to discover the repository contract, start an isolated local stack, run one complete verification command, test the web app and browser extension, and obtain production or per-PR Cloudflare deployments without hidden machine state.
- **Guardrails**: preserve intended product behavior; treat a user-supplied browser-local JWT secret as a deliberate client credential unless the product trust model changes; never turn that credential into a shared Cloudflare/build secret; keep database schema authority in `core-py`; keep PRD and Product TDD authority in `InKCre/docs`; use official SVC `10.0.1` rather than copied framework documents; isolate Hub edits, shared-reference bumps, and Spoke implementation; require explicit user authorization before any non-packet mutation.
- **Verification**: a clean checkout completes a frozen install; one root command checks every workspace package; Portless and SVC expose deterministic worktree-local capabilities; Docker PostgREST is backed by the authoritative schema; unit, web E2E, and Chromium extension E2E pass; each eligible PR gets a verified Cloudflare Pages preview; protected `main` deploys the exact accepted static artifact to production; no Cloudflare variable or public artifact contains a shared JWT signing credential; SVC and shared-doc freshness checks pass.
- **Current Truth**: client-web builds a static Vue SPA. The current Cloudflare Worker/Hono wrapper only provides runtime config endpoints and static-asset fallback; its HTTP config adapter is not the default. JWT signing is intentionally performed in the browser from a configurable secret that may be stored in localStorage, embedded by Vite, or fetched through the optional HTTP adapter. The reproducibility and SVC/shared-doc slices are committed. Client-web and the `InKCre/docs` Hub have healthy, idempotent SVC 10.0.1 adoption surfaces generated from the official wheel. The Hub's copied v9 framework projection was hard-cut in published commit `ad464fd`, while InKCre-owned PRD, Product TDD, submodule profile, and shared-editing workflow remain. Client-web mounts that exact published commit read-only at `docs/_shared`. Phase 2 is complete locally: Oxfmt/Oxlint own the root quality contract; stable TypeScript 5.9 and Vue TSC are required; native TypeScript 7 and type-aware Oxlint are green shadow lanes; `@inkcre/core` is an ESM-only tsdown package; and all five workspace members pass the explicit type/build contract. See [evidence](./10-evidence.md).
- **Next Step**: review and commit Phase 2 as one intentional toolchain/package-contract cut, then explicitly start Phase 3's static/local-runtime work.

## Packet Map

- [10-evidence.md](./10-evidence.md) - observed repository, deployment, config, auth, and branch facts; no target claims.
- [20-decisions.md](./20-decisions.md) - candidate decisions, rationale, rejected alternatives, and revisit triggers.
- [30-target-contract.md](./30-target-contract.md) - desired command, toolchain, package, local-runtime, SVC, and knowledge contracts.
- [40-testing-delivery.md](./40-testing-delivery.md) - test pyramid and Cloudflare Pages preview/production lifecycles.
- [50-roadmap.md](./50-roadmap.md) - independently verifiable execution slices and exit proofs.
- [90-review-checklist.md](./90-review-checklist.md) - user decisions, hard cut-off boundary, exclusions, and decision log.

## Classification and Posture

- Input lenses: Constraint + Reality + Artifact.
- Active posture: Solidify.
- The user authorized implementation steps 1, 2, and 3; later implementation slices still require an explicit start.
- Solidify exits when static hosting, client credential provenance, PostgREST ownership, TypeScript policy, and branch cutover are explicit.

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
- Step 3 is complete locally and uncommitted. It hard-cuts Prettier/Biome/ESLint/tsup surfaces, establishes root Oxfmt/Oxlint and explicit workspace/package validators, normalizes stable TypeScript 5.9 plus Vue TSC, adds green native TypeScript 7 and type-aware Oxlint shadow lanes, migrates `@inkcre/core` to an ESM-only tsdown contract, and repairs the stale package/API edges required for all workspace type checks and builds to pass.
- Phase 2 verification is green for `pnpm run doctor`, `pnpm format:check`, `pnpm lint`, `pnpm lint:type-aware`, `pnpm type-check`, `pnpm type-check:ts7`, `pnpm build`, and the root `pnpm check` contract. Frozen install proofs are refreshed before handoff.
