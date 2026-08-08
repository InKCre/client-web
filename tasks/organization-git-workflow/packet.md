# Organization Git and GitHub Workflow

- **Objective**: establish one organization-level Git and pull-request workflow for the active `core-py`, `client-web`, `ui`, and `docs` repositories, with a shared governance baseline and repository-type-specific CI/CD profiles.
- **Guardrails**: stay within GitHub Free; keep application, package, and documentation-site delivery semantics distinct; use `InKCre/.github` as the future GitHub-native governance owner without moving product or system truth out of `InKCre/docs`; do not introduce cross-repository changelog or change-set machinery; keep pull-request validation free of canonical publication and production authority; do not change code, repository settings, workflows, or remote state without a separate explicit start.
- **Verification**: live GitHub settings and checked-in workflows for all four repositories match the approved baseline; required checks protect pull requests before merge; unresolved review conversations block merge; pull-request workflows do not publish canonical artifacts or mutate shared release environments; any post-merge workflow has a repository-specific release or deployment purpose; checked source and released artifact identity are stated accurately; the organization default contribution guide and pull-request template render from `InKCre/.github`; a final read-only audit finds no unexplained governance drift.
- **Current Truth**: Phases 0-3 are complete. The Phase 3 acceptance anchor on `client-web/main` was `cc857104e07cc41bc77db19acf75676b0cb22d15`; later documentation-only merges may advance the branch without replacing that evidence. Pull-request and merge-group validation resolve core-py's production-admitted `stable` image once, generate Supabase types from its raw PostgreSQL schema artifact, run the real core service against fresh pgvector/PostgreSQL and PostgREST, and report the four direct required contexts `Workspace contract`, `Dependency review`, `client-web E2E`, and `client-webext E2E`. PR #49 and merge-group run `31256717813` live-proved all four checks on the synthetic current-main commit. Same-repository Pages preview, close-time stable-alias retirement, focused exact-main build, same-run artifact delivery, and production smoke are live-proven. Main protection now applies to administrators, requires resolved conversations and linear history, rejects force-push/deletion, and disables merge commits; Actions defaults are read-only, Actions cannot approve PRs, and every external fork run requires maintainer approval. The temporary one-entry merge queue was removed after the probe so squash remains the default rather than a forced merge method and rebase remains available. Core producer PRs #43/#44 and client PRs #40/#43/#45/#47/#48/#49 merged normally without administrator bypass. Deferred synchronized product work is preserved as mergeable draft PRs [client-web #50](https://github.com/InKCre/client-web/pull/50) and [core-py #45](https://github.com/InKCre/core-py/pull/45), with original snapshot branches retained.
- **Next Step**: publish the concise `.github` governance amendment now that Phase 3 behavior is live-proven, then proceed only under a separate start to the remaining `core-py`, `ui`, and organization-wide hardening phases. Review core-py #45 first; when its schema-bearing service reaches `stable`, rerun client-web #50 so generated types and real-service E2E become its admission proof. Keep PR #50 draft until then. Do not weaken E2E or restore the obsolete checked source/image/migration tuple.

## Target `client-web` Operating Model

This is the accepted Phase 3 operating model. The notes below distinguish live controls from deferred
full-stack preview convenience.

1. A contributor branches from current `client-web/main`, or from the immediate parent branch for a
   stack, and opens a pull request targeting `main`.
2. A client-owned resolver reads core-py's production-admitted `stable` pointer and immediately
   resolves it to one immutable image digest. A tracked Docker Compose topology receives that digest
   as `CORE_IMAGE`; no core version is committed into the client tree and no dependency-update pull
   request is involved.
3. Four existing checks run for ordinary pull-request feedback and again for final `merge_group`
   admission:
   - `Workspace contract` performs the frozen install, regenerates working-tree types from the
     selected neutral core schema through mature tooling, then runs repository checks, dependency
     audit, compilation, and real consumer tests; harmless generated-snapshot drift is not a gate;
   - `Dependency review` reports dependency changes on the pull request;
   - `client-web E2E` creates an empty pinned pgvector PostgreSQL service, uses the exact stable
     core image to initialize and run the real core service, starts pinned PostgREST, and verifies
     browser read/write/deny behavior;
   - `client-webext E2E` validates the extension and its artifacts.
4. A successful same-repository pull request deploys the checked web artifact to the deterministic
   `preview/client-web/pr-N` Pages branch. Closing the PR replaces that stable alias with a trusted
   no-store/noindex tombstone while retaining Cloudflare's immutable deployment history. The web
   artifact remains environment-neutral; Neon/core/PostgREST preview bootstrap is deferred until the
   small localStorage inconvenience justifies the production-shaped data lifecycle. Fork pull requests
   require maintainer approval before Actions run, remain secret-free, and never receive preview
   delivery.
5. Merge eligibility requires the four strict checks on the latest client base and resolved review
   conversations. Zero approving reviews are required initially. Administrators have no routine
   bypass; force pushes, branch deletion, and merge commits are disabled. A temporary one-entry queue
   proved the `merge_group` path, then was removed because GitHub assigns one fixed queue merge method.
   Squash remains the documented default and rebase remains an intentional option for curated stacks.
6. A push produced by merging into protected `main` starts one focused web release. It checks out the
   exact main SHA, rebuilds only `@inkcre/client-web`, verifies and uploads a release artifact, then
   deploys that same-run artifact through the `production` environment after confirming the selected
   SHA is still current main. Production smoke is delivery evidence, not a pull-request gate.

If a client change depends on a core change, both branches may be developed concurrently, but core-py
must merge and successfully deliver first. The client pull request need not be mutated immediately
when core changes, but it must rerun the current required checks before final admission so validation
resolves current `stable` and proves the candidate against that immutable digest. The live-proven
`merge_group` path remains available if a permanent queue is later preferred over per-PR merge-method
choice. No dependency commit,
cross-repository PR link, notification credential, or fan-out receiver is involved.

## Completed compatibility reset for Phase 3 acceptance

The first live `stable` probe proves that current `client-web/main` is already ahead of the delivered
core database/runtime contract. A branch merely created from an older client commit would not solve
that mismatch: GitHub tests and merges the candidate with current `main`, so the v3 client changes
already on `main` would remain in the synthetic merge.

The completed reset sequence was:

1. Preserve current client main `8324293` on a named synchronized-development branch. This retains
   the unpublished semantic-content, binary-storage, peer/capability, runtime-acceptance, and shared
   truth work without requiring its current draft work to close.
2. Create a compatibility branch from current `main` and revert, newest first, `8324293`, `ca4899c`,
   `66d083d`, and `765b22f`. Keep `f2ab107`: it only corrects the extension config path and matches the
   endpoint already present in current core production. The resulting product tree aligns with the
   v1 schema/runtime currently carried by core `stable`.
3. Merge that rollback through an ordinary pull request and required checks. This is an intentional
   product rollback, not a history rewrite; the future commits remain addressable and reviewable.
4. Rebase the Phase 3 dependency, contract/E2E, and delivery slices onto the compatibility main. The
   required `client-web E2E` then tests the real v1 client against the real production-admitted v1
   core service on a fresh database; it must not retain v3-only peer configuration assertions.
5. Complete the check-name migration, preview/main delivery proof, merge-group admission, and
   repository-setting acceptance on actual protected main.
6. After core's v3 product series is delivered and moves `stable`, restack the preserved client work
   on the then-current main and reintroduce it through a separate product pull request. Its generated
   types, compile/tests, and real-service E2E become the proof that the synchronized feature is ready.

This reset can unblock Phase 3 without weakening the gate because it changes the admitted product
surface to the one actually supported by production. Merely deleting the peer assertion while
leaving peer-dependent application code on main would remain a false green and is rejected.

## Supporting Material

- Evidence:
  - `client-web` PR #29 checked synthetic merge commit `9cb69ce`; its tree `7bc0d1a` equals the final squash commit `400c581` tree, while the commit identities differ. The main run rebuilds that tree and `pages-deploy.yml` deploys the uploaded `client-web-dist` unchanged.
  - `core-py` CI builds and tests the Dockerfile's `artifact` target; `artifact-publish.yml` rebuilds that target for GHCR; `production-deploy.yml` separately builds `heroku-web`, `heroku-release`, and PostgREST images before delivery.
  - `docs` `Website checks` builds and uploads `inkcre-website-dist` on pull requests and main; `Pages deployment` downloads the successful current-main artifact without rebuilding. Current main run `31143401361` and deployment `31143435829` are green, but `Website contract` is not required because main is unprotected.
  - `ui` requires `Reproducible workspace check` through a repository ruleset. Its main-only Changesets workflow creates a release PR when changesets exist and publishes `@inkcre/ui-web` after that PR reaches main. Release PR #34 is currently blocked because its bot-authored check run is `action_required` and the required context was not emitted.
- Decisions:
  - Scope is the four active repositories; `InKCre/.github` is the governance carrier and control-plane exception; GitHub Team is out of scope; cross-repository change-set and changelog coordination are out of scope.
  - Pull-request workflows validate candidate changes. They may use scoped delivery capability to create an isolated, deterministic, short-lived preview as validation evidence, but may not publish a canonical release, mutate a shared release environment, or exercise production authority. Preview writes still require a trusted controller, same-repository source, scoped credentials, deterministic naming, concurrency isolation, and cleanup. A persistent shared staging environment is part of the release lane rather than this preview exception.
  - Protected `main` is the release authority. Release workflows may rebuild a PR-tested source tree, but once a main release produces a canonical artifact, later publication and deployment stages should promote that exact artifact rather than rebuild it. The organization standard requires accurate source and artifact provenance; it does not require equality between an earlier PR build and the main release build.
  - `client-web` should use full pull-request validation and a focused main web-release build instead of rerunning unrelated database and browser-extension checks before deployment.
  - `client-web` consumes the database contract owned by `core-py`, not core-py source code or migration revisions. It resolves the current production-admitted `stable` OCI release as an executable upstream integration dependency for each validation run. The container format is transport and runtime identity, not the database compatibility interface.
  - Contract compatibility and runtime integration are separate evidence. PostgreSQL schema/catalog is the native database DSL. Core-py publishes neutral raw schema SQL from the actually migrated database inside the immutable service release; it does not generate TypeScript or depend on client-web tooling. Client-web extracts that file and uses a mature downstream generator compatible with its existing `@supabase/postgrest-js` client, then compile/tests the actual consumer under required `Workspace contract`. Browser E2E starts the same release image as the real upstream service without treating the container format as the database contract.
  - The 2026-08-08 spike selects PostgreSQL 17 whole-database `pg_dump` with a source-SHA `--restrict-key`, Supabase CLI `2.112.0`, the repository formatter, and a stable five-export adapter. It proves restore, deterministic generation, TypeScript compilation, and consumer tests for the current v3 surface. Supabase's pgvector `string` mapping and omission of the unnamed raw-body blob RPC are accepted Phase 3 semantics because the current typed consumer compiles/tests and blob transfer already uses raw PostgREST fetches.
  - A mutable core `stable` alias is discovery only. Every client validation resolves it once to an immutable digest, uses that digest consistently, records it in job evidence, and rechecks the alias before reporting success. Core changes the alias only after the canonical exact-main candidate has been published and that same image content has passed production delivery.
  - `stable` is a mutable, production-state-labelled OCI channel, not a version identity or a claim that the image is bug-free. The current `main` tag moves after artifact publication but before production success, and `latest` would be only a mutable Docker default with no stronger meaning. The consumer executes the resolved digest; `stable` answers which canonical core image is currently active after successful production admission. A production rollback must move `stable` back to the restored image after rollback smoke.
  - Do not introduce schema SemVer or a client-supported version range. The existing `v1`/`v2`-style schema revision is sufficient contract identity; compatibility is demonstrated by generated language types, compiler, and tests. If broader structural comparison later proves necessary, use the PostgreSQL/OpenAPI schema AST or a standard compatibility mechanism rather than a handwritten table of breaking-change rules.
  - `client-web E2E` uses an isolated per-job local runtime and remains a required merge gate. A tracked Compose contract provisions fresh pinned pgvector PostgreSQL; the resolved immutable core-py release performs one-shot database initialization and then runs the real core web service, while pinned PostgREST serves the browser API. The job exercises read/write/deny behavior and is discarded with the runner. The image is the production-admitted upstream service under integration test, not the database compatibility contract.
  - Do not branch from the production database for the default lane. A provider branch adds credentials, lifecycle cleanup, quotas, external availability, and—if based on production—data exposure. Reconsider a sanitized main-derived database branch only if local pgvector/PostgreSQL is proven behaviorally insufficient.
  - Upstream ordering is the coordination mechanism. Core-py and client-web branches may be authored concurrently, but a dependent client-web pull request is not merge-eligible until the core change has merged to `core-py/main`, its service release has entered `stable`, and the client's current required checks have rerun against that digest. No dependency-update pull request, core pull-request artifact, immediate open-PR refresh, or preview-lifecycle linkage is required.
  - Core delivery remains backward-compatible with current `client-web/main`. A breaking removal uses expand/migrate/contract sequencing: core first delivers the additive surface, client migrates through its own checks, and only a later core change removes the old surface. The live-proven merge-group path can narrow the admission window when a permanent queue is justified, but this evolution rule is the underlying guarantee because two repositories cannot share an atomic lock across their final state changes.
  - Required CI and human preview use different databases. `client-web E2E` owns a fresh data-free local pgvector service for deterministic read/write/deny assertions. A same-repository human PR preview owns a PR-lifetime Neon branch derived directly from production plus a matching resolved core/PostgREST deployment. Automatic application runtime bootstrap and a sanitized intermediate parent are explicitly out of Phase 3; reviewers configure the existing browser settings manually when they need to exercise the remote full stack.
  - Validate at the authority boundary. An open pull request is a candidate, so temporarily stale upstream evidence is harmless until it is about to change protected `main`. Fresh required checks at final admission are the consequential boundary; a merge queue is one strong implementation and was live-proven, but GitHub's fixed queue merge method conflicts with the accepted optional-rebase policy. Prefer one final proof over broadcasting invalidation to every speculative candidate. This guide applies when stale candidates have no side effects and a final gate can revalidate them; it does not excuse stale evidence before preview publication, production delivery, or another externally visible mutation.
  - Cross-repository immediacy is deliberately not a requirement. A dedicated App, PAT, polling workflow, receiver, and dependency-update pull request all add machinery without improving the selected invariant: an incompatible prospective merge must not enter `main`. Open pull requests may display older evidence until their next normal update or queue admission.
  - “Isolate core work” means create a separate clean worktree from an explicitly chosen commit, not wait for the existing primary worktree to become clean. Phase 3 used that method for the producer foundation, then preserved the primary product history and later task edits on original/snapshot branches before restacking all twelve commits as core-py draft PR #45.
  - All external fork contributors require maintainer approval before their Actions run. Approval permits the read-only, secret-free CI run only; it does not make the fork eligible for preview credentials or delivery.
  - `core-py` keeps independent PR validation but should stop rebuilding after the protected-main candidate exists. Its main release builds and tests one canonical core service image, publishes it to GHCR by immutable digest, then pulls and transfers that same image content to Heroku for the web process. Registry-specific manifest identifiers may differ after transfer; the release record must bind both to the same local image/config/layers and source SHA. PostgREST remains a separate image, and one-shot database commands may override the canonical core image command without creating a second core code artifact.
  - Artifact publication is not correctness proof. A successful push proves identity and availability in GHCR; the image's tests prove only the exercised contract. If Heroku fails before image release, the same digest can be retried and the likely fault is delivery infrastructure. If release, migration, boot, readiness, or production smoke fails, the image may still be incompatible with production configuration/data/runtime, so it is not cleared merely because publication succeeded. Keep the immutable candidate for diagnosis, leave `stable` unchanged, and classify the failure by the first failed boundary.
  - `docs` should run website CI on pull requests. Its main delivery workflow should build the exact protected-main revision, run the release contract, and deploy that build, instead of treating a pull-request artifact as the release input.
  - `docs` pull-request validation includes an isolated Cloudflare Pages preview for successful same-repository pull requests. The preview uses the checked pull-request artifact through a trusted controller, deterministic PR namespace, `noindex`, concurrency isolation, and close-time retirement; it never becomes the production artifact. Closure replaces the live preview with a trusted `noindex` tombstone; older immutable deployments remain in Cloudflare history. Fork pull requests remain build/test only.
  - Unresolved review conversations should block merge. Merge commits should be disabled and linear history required. Squash is the documented default; rebase merge remains available for intentionally curated commit series and stacked-pull-request work. GitHub exposes allowed merge methods but no repository setting that makes squash the enforced UI default while rebase remains available, so the preference is a documented convention rather than a mechanical gate.
  - The initial rollout requires pull requests but zero approving reviews; conversation resolution and required checks remain mandatory. Automatic branch deletion stays disabled while stacked pull requests are being learned.
  - `.github` is not an active product repository and is outside the common branch-policy baseline. Phase 1 directly published its GitHub-native governance/community files to `main`, retired the superseded VitePress/Pages site, and moved the organization website link to `https://inkcre.dev`.
- Open questions: whether the private core image is readable in an approved secret-free fork workflow or should become public; whether a future typed consumer actually needs a numeric pgvector override; how Heroku's registry reports the transferred image ID relative to the GHCR manifest; the final squash-commit title/body defaults; whether repeated `ui` release-PR approvals justify a separate repository-scoped GitHub App; and whether real stack frequency justifies stack tooling.
- Work: [`implementation-plan.md`](./implementation-plan.md) contains the independent, phased mutation and verification plan.
- Phase 0: [`evidence/phase-0/README.md`](./evidence/phase-0/README.md) summarizes the completed live baseline; manifest digest is `5895234b94c5412cc84afbc880c402a175cda9e121b07cb1f726f41ec8ed5ecf`.
- Phase 1: [`evidence/phase-1/README.md`](./evidence/phase-1/README.md) records the published governance carrier, legacy-site retirement, live inheritance checks, and remote cleanup.
- Phase 3: [`evidence/phase-3/README.md`](./evidence/phase-3/README.md) records discovery, spikes, implementation, live acceptance, settings, and recovery PR evidence.
