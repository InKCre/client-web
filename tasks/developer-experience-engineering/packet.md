# Client Web Developer Experience Engineering

- **Objective**: establish a reproducible, static-first, agent-friendly development and delivery contract for the InKCre web monorepo. A fresh human or agent should be able to discover the repository contract, start an isolated local stack, run one complete verification command, test the web app and browser extension, and obtain production or per-PR Cloudflare deployments without hidden machine state.
- **Guardrails**: preserve intended product behavior; treat a user-supplied browser-local JWT secret as a deliberate client credential unless the product trust model changes; never turn that credential into a shared Cloudflare/build secret; keep database schema authority in `core-py`; keep PRD and Product TDD authority in `InKCre/docs`; use official SVC `10.0.1` rather than copied framework documents; isolate Hub edits, shared-reference bumps, and Spoke implementation; require explicit user authorization before any non-packet mutation.
- **Verification**: a clean checkout completes a frozen install; one root command checks every workspace package; Portless and SVC expose deterministic worktree-local capabilities; Docker PostgREST is backed by the authoritative schema; unit, web E2E, and Chromium extension E2E pass; each eligible PR gets a verified Cloudflare Pages preview; protected `main` deploys the exact accepted static artifact to production; no Cloudflare variable or public artifact contains a shared JWT signing credential; SVC and shared-doc freshness checks pass.
- **Current Truth**: client-web builds a static Vue SPA. The current Cloudflare Worker/Hono wrapper only provides runtime config endpoints and static-asset fallback; its HTTP config adapter is not the default. JWT signing is intentionally performed in the browser from a configurable secret that may be stored in localStorage, embedded by Vite, or fetched through the optional HTTP adapter. The reproducibility slice now pins Node 22.22.3/pnpm 10.26.2, commits one lock contract for all six workspace projects, keeps registry credentials outside repository configuration, and completes a real frozen install. The restored baseline is not green: static client-web bundling succeeds, while type checks, core declarations, webext, and Twitter extension checks expose existing failures. See [evidence](./10-evidence.md).
- **Next Step**: review the completed reproducibility slice, then explicitly start the SVC v10 and shared-doc ownership slice before it changes either this Spoke or the `InKCre/docs` Hub.

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
- The user authorized implementation step 1 only; later implementation slices still require an explicit start.
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
- Completed locally: runtime/package-manager pin, lock tracking boundary, trusted npmrc boundary, Copilot setup version/auth wiring, removal of a direct Windows-only Rollup package, prerequisite documentation alignment, a regenerated six-importer lockfile, dependency restore, and frozen-install proof.
- GitHub CLI authentication was granted `read:packages`; a temporary trusted npmrc resolved `@inkcre/web-design` without persisting or printing the token.
- Baseline checks are captured. Client-web's static build succeeds; existing type, declaration, webext build/test, and Twitter extension build failures remain deliberately unfixed in this slice.
