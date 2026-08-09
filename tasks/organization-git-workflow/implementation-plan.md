# Organization Git and GitHub Workflow Implementation Plan

- **Status**: Phases 0-5 are complete. Phase 3 landed the core schema-bearing stable release foundation, the client stable resolver/typegen/real-service E2E contract, separate PR preview and exact-main delivery controllers, direct required-check names, and the accepted repository settings. Client PR #49 was admitted through a real one-entry merge queue; merge-group run `31256717813` passed all four required checks on synthetic commit `cc857104`, which became main. The temporary queue rule was then removed so GitHub does not force one merge method; squash remains the default and rebase remains available. Preview cleanup run `31256442627`, automatic cleanup run `31256837743`, and production runs `31256434332`/`31256836894` passed. Deferred full-stack preview bootstrap and live external-fork package-access probing are recorded rather than represented as finished. The reverted synchronized product series is preserved without conflicts in draft client-web #50 and core-py #45. Phase 4 independently aligned core-py governance through merged PR #46 and live-proved main CI, immutable publication, production admission, `stable`, and cleanup before removing its temporary worktree. Immediate fan-out, dependency-update pull requests, and a cross-repository GitHub App remain rejected. Phase 5 resolved release PR #34 and package `1.3.1`, published the check-name governance, merged runner-CD foundation PR #35 and sequential cutover PR #36, disabled Cloudflare automatic Git builds after dual-run proof, live-proved runner preview/cleanup and exact-main same-run production delivery, adopted `ui-web checks`, serialized release runs, and completed the UI ruleset/merge-method transition. Phase 6 has applied and live-verified the four repositories' read-only workflow defaults, disabled Actions review approval, all-external fork approval, full-SHA enforcement, and the missing client-web production-main policy. Final settings and workflow audits pass; only explicit publication of the local governance and task-packet records remains.
- **Control surface**: [`packet.md`](./packet.md) owns current task state and decisions. This file owns execution order, planned mutations, verification, and rollback.
- **Durable owner**: `InKCre/.github` will own the organization Git and GitHub workflow standard. Repository code, tests, release mechanics, and profile-specific instructions remain with each repository.
- **Enforcement scope**: `InKCre/core-py`, `InKCre/client-web`, `InKCre/ui`, and `InKCre/docs`. `InKCre/.github` is included only as the governance control plane.
- **Rollout rule**: each phase requires its own Impact Handshake and explicit human start. Commit, push, pull-request creation, repository-setting changes, GitHub App installation, credential changes, and publication require their normal explicit authorization.

## Outcome

- Contributors see one organization default contribution flow and pull-request evidence shape.
- Every scoped `main` branch is pull-request-only, including administrators, with strict repository-specific checks and resolved review conversations.
- Merge commits are disabled. Squash and rebase remain available; squash is the documented default.
- Pull-request workflows validate candidates and may create isolated previews. Only protected `main` authorizes canonical package publication or production delivery.
- Application and documentation delivery rebuild the exact protected-main source revision. They verify and deploy the artifact produced by that release run without claiming byte equality with an earlier pull-request build.
- Package delivery remains Changesets-driven from `ui/main`.
- GitHub Free limitations are handled through repository-level controls rather than organization rulesets.

## Non-Goals

- Do not buy or depend on GitHub Team.
- Do not introduce generalized cross-repository change sets, changelogs, atomic merges, pull-request linkage, or orchestration infrastructure. Protocol evolution uses ordinary dependency ordering: core-py merges and delivers first; client-web then refreshes and validates against current upstream main.
- Do not force identical CI jobs on application, package, and documentation repositories.
- Do not require byte-for-byte equality between independent pull-request and release builds.
- Do not introduce mandatory human approval, CODEOWNERS approval, cross-repository propagation credentials, or an organization-wide GitHub App solely for this baseline. Keep `client-web` merge-group capable; require a permanent queue only if its stronger final-admission proof later outweighs GitHub's single fixed queue merge method.
- Do not recreate a product/documentation site or CI/CD workflow in the non-active `.github` governance carrier.

## Common Repository Policy

- Protect `main` with no standing bypass, including administrators.
- Require a pull request. Use zero required approving reviews during the initial two-maintainer rollout; this is PR-centric governance, not mandatory peer review.
- Require all configured status checks against the latest base revision.
- Require review-conversation resolution.
- Reject force pushes, deletion, and merge commits; require linear history.
- Allow squash and rebase merges. Document squash as the normal choice and rebase as an intentional choice for curated commit series or stack maintenance.
- Leave automatic branch deletion disabled while the stacked-PR workflow is being learned.
- Name reported check contexts `<scope> <kind>` in lowercase. Use the repository name as `scope`
  unless a monorepo job validates one independently understood application or package, in which case
  use that application or package name. Validation kinds are `checks`, `tests`, and `e2e tests`:
  `checks` is the aggregate code/build/package contract; use `tests` or `e2e tests` when those lanes
  report independently. Delivery jobs use `preview`, `preview cleanup`, and `deployment`. Keep
  implementation adjectives and internal architecture terms in step names and documentation rather
  than public check names.
- Treat required-context names as stable GitHub API. Bind them to the GitHub Actions app when the
  setting supports a source identity, and migrate each existing repository only alongside a real
  workflow change. Phase 5 applies this convention to `ui-web checks`; existing names in
  `client-web`, `client-webext`, `core-py`, and `docs` remain unchanged until their next justified
  workflow slice.
- Repository-owned check contexts follow this naming convention. Provider-owned integration checks,
  such as Cloudflare's fixed `Cloudflare Pages` context, retain the provider name and are documented
  separately; do not create a duplicate wrapper job merely to rename them.
- Treat an emergency rule change as audited break-glass work: state the reason and affected repository, obtain explicit authorization, restore the baseline immediately after recovery, and follow with a pull request. Do not maintain a routine administrator bypass.

## Stacked Pull-Request Convention

- Each dependent pull request names its immediate parent and any known children in the pull-request body.
- Merge bottom-up: merge the parent first, then restack the child onto the new protected `main`, update its base, and rerun strict checks.
- Do not merge a child that still contains an unmerged parent's changes.
- Default to squash for ordinary parent and child pull requests. Use rebase merge only when retaining a deliberately curated commit series improves review or diagnosis.
- Do not assume GitHub rebase merge preserves ancestry: GitHub rewrites commit SHAs, so restacking is still required.
- Keep stack tooling optional until the manual procedure has been exercised on real work. Do not add organization infrastructure before the repeated cost is known.

## Planned Durable Surfaces

### `InKCre/.github` Control Plane

- Add `GOVERNANCE.md` as the canonical organization Git and GitHub workflow standard:
  - scope and repository profiles;
  - branch and pull-request policy;
  - status-check and conversation semantics;
  - squash-default, rebase-allowed merge policy;
  - stacked pull-request procedure;
  - stable `<scope> <kind>` public check naming for validation and delivery jobs;
  - candidate validation, preview delivery, release authority, and artifact identity;
  - GitHub Free enforcement and exception handling.
- Add `CONTRIBUTING.md` as the concise contributor entrypoint. Link to `GOVERNANCE.md` and require repository-local verification commands.
- Add `.github/pull_request_template.md` with concise fields for intent, evidence, risk and rollback, delivery side effects, parent pull request, and child pull requests.
- Update `profile/README.md` to link to the governance and contribution entrypoints without turning the organization profile into a second policy owner.
- Replace the repository `README.md` with a concise map of the GitHub-native files and a pointer to `InKCre/docs`/`https://inkcre.dev`.
- Remove the superseded VitePress source, Node package files, Pages workflow, site-specific editor/configuration files, GitHub Pages site, and `github-pages` environment.
- Keep `.github` outside the active-repository branch-policy baseline; it owns no required check, release workflow, or deployment workflow.
- Do not add a generic reusable workflow, policy bot, cross-repository credential, or machine-readable governance layer in the first rollout. Reconsider read-only drift automation only after manual drift becomes a demonstrated cost.
- Publish a concise Phase 3 policy amendment after the client design is accepted:
  - explain that external-fork workflow approval controls whether read-only CI starts and never grants preview or production credentials;
  - describe the authority-boundary rule: ordinary pull-request checks are candidate feedback and must be refreshed before consequential admission; `client-web` has also live-proven merge-group validation against current upstream delivery;
  - record that no cross-repository dispatch credential, dependency-update pull request, or open-PR fan-out is required;
  - refresh the `client-web` profile to use the clearer check names and distinguish deterministic local CI data from a production-derived human preview database;
  - keep Neon, browser configuration, and service-deployment commands in `client-web`, not in organization policy.

GitHub uses defaults from a public `.github` repository only when a repository has no local file of the same type. The rollout must therefore preserve intentional local overrides and align them explicitly rather than assuming inheritance.

### `InKCre/core-py` Service Profile

- Keep the current CI, preview delivery, and Heroku production services, but converge GHCR publication and Heroku core-web delivery on one canonical image artifact.
- Keep the four required contexts:
  - `Hermetic repository contract`;
  - `Dependency security review`;
  - `Portable peer database runtime`;
  - `Provision isolated branch`.
- Update branch settings to require linear history while preserving administrator enforcement, strict checks, conversation resolution, and the existing no-deletion/non-fast-forward ruleset.
- Disable merge commits at repository level; retain squash and rebase.
- Update local `CONTRIBUTING.md` to link the organization policy while preserving PDM, migration-integrity, and repository-specific verification instructions.
- Pin third-party Actions to immutable commit SHAs before enabling the repository SHA-pinning setting. Local composite actions remain local references.
- Keep production restricted to `main` and retain exact-current-main source verification.
- Describe the release invariant as exact protected-main source plus recorded output identity. PR validation may build independently; the protected-main release must build and test one canonical core service image, publish its immutable GHCR digest, and transfer that same image content to Heroku without a production rebuild.
- Treat the PostgreSQL schema/catalog as the database DSL. Initialize a separate neutral runtime database, then export its raw schema with PostgreSQL 17 `pg_dump --schema-only --no-owner --no-privileges --restrict-key=$SOURCE_SHA` over the whole database. Append data only for `public.alembic_version` and `inkcre_internal.contract_state`, so restore can resume the lifecycle without carrying application rows. The fixed official restrict key removes meaningless dump churn; the whole-database dump retains pgvector and `inkcre_internal` dependencies that `--schema inkcre` alone omits. Core-py must not generate client-web TypeScript or depend on downstream tooling.
- Include that schema SQL and small release metadata in the immutable core service OCI image. Keep the existing opaque `v1`/`v2`-style schema revision; do not create a schema SemVer range or a second independently coordinated schema package.
- Prefer compatibility evidence supplied by the native schema, mature generator, TypeScript compiler, and consumer tests. Add a structural PostgreSQL/OpenAPI AST comparison only if a concrete gap remains; do not build a handwritten breaking-change classification engine.
- Treat migration heads and source revisions as core-py implementation/provenance details rather than the client-facing compatibility interface. The client depends on the production-admitted `stable` OCI release as an executable integration dependency; raw PostgreSQL schema inside it remains the database contract.
- Build and test one immutable SHA-addressed candidate from protected `main`, then publish it to GHCR. Production must pull that exact digest and retag/push the already built image to Heroku's web process; it must not rebuild from source. Record the GHCR digest, source SHA, local image/config/layer identity used for the Heroku transfer, Heroku image/release identity, and production smoke result. Registry-specific manifest IDs may differ after transfer, so prove content lineage rather than assuming identical digest strings across registries. PostgREST remains a separate image; database initialization may run the canonical core image with an explicit command override. Move mutable `stable` only after that exact candidate passes production. `stable` means “currently production-active after successful admission,” not “bug-free” or “immutable”; a successful rollback moves it back to the restored digest. Do not reuse `latest`: it is Docker's mutable default and does not distinguish “newest published candidate” from “production-admitted candidate.” A publication-only success remains a diagnosable candidate, not a stable release. Core-py pull-request previews remain core-owned validation and are not downstream client inputs.
- Serialize the core release as `Repository and artifact checks` -> `Publish runtime artifact` -> `Production application`. Production listens to successful artifact publication rather than running beside it, verifies the exact current-main SHA/tag/label, and moves `stable` in the same job only after Heroku smoke passes. This stays within GitHub's three-level `workflow_run` chain and removes the previous third-level join. Preserve a bounded manual production retry that selects the already published current-main digest; retry must not rebuild it.

### `InKCre/client-web` Application Profile

- Prerequisite: restore the dependency baseline, then remove the over-coupled image-based peer-database merge gate through an explicit required-check migration rather than silently skipping it.
- Modify `.github/workflows/ci.yml`:
  - trigger on pull requests targeting `main` with `opened`, `synchronize`, `reopened`, and `ready_for_review`; `merge_group` with `checks_requested`; plus manual dispatch;
  - remove `push: main`;
  - keep `Workspace contract` and rename the other three required contexts to `Dependency review`, `client-web E2E`, and `client-webext E2E`, then migrate branch protection only after those exact GitHub Actions contexts have successful evidence;
  - keep schema-artifact validation, per-run type generation, and actual TypeScript compilation inside required `Workspace contract`; the checked generated snapshot serves local development and is not an upstream-freshness lock;
  - resolve the current core `stable` alias once at the start of validation and expose the immutable digest/source/schema identity as shared job outputs; repeat this for the synthetic merge-group commit rather than reusing PR-run outputs;
  - keep `client-web E2E` required, but remove the exact source/image/migration tuple as its compatibility rule and run that resolved immutable core service through the tracked Compose topology;
  - keep the type-aware and TypeScript shadow job non-blocking;
  - continue uploading the web artifact for eligible preview delivery and failure evidence for diagnosis.
- Replace the bespoke `contracts/core-py.json` tuple with a checked-in Docker Compose integration topology. It accepts `CORE_IMAGE` as an exact digest at runtime and keeps client-owned pgvector/PostgREST pins in the client tree; local development and CI use the same explicit service graph without committing a core release version.
- Enable a repository-level merge queue for `client-web/main` after the `merge_group` workflow is live:
  - use squash as the queue merge method and begin with build concurrency one and one pull request per merge group;
  - require the same four GitHub Actions contexts on the merge-group commit;
  - use the pinned Dependency Review action's native `merge_group` support rather than maintaining a local event-payload mapping;
  - run the full workspace, client-web E2E, and client-webext E2E against the synthetic group commit and current resolved core digest;
  - recheck `stable` before final success and fail the queue run if it moved;
  - keep ordinary PR checks for reviewer feedback, but treat merge-group evidence as the decisive admission proof.
- Do not add `upstream-propagation.yml`, a dedicated dependency-propagation App, a PAT, polling, synthetic commits, or a core-to-client dispatch step. Open pull requests may retain older evidence until they update normally or enter the queue.
- Define the client database-contract boundary:
  - resolve the `stable` alias to an exact digest and extract its neutral raw schema SQL and opaque schema revision;
  - restore the SQL into a disposable PostgreSQL type-generation environment and generate client-owned TypeScript with pinned Supabase CLI `2.112.0`, then apply the repository formatter; required CI writes that output into its disposable checkout before compilation, while the checked snapshot supports local navigation; keep only a stable handwritten adapter that re-exports `Database`/`Json` and defines `InkcreSchema`, `RelationName`, and `RelationRow`;
  - fail `Workspace contract` for an invalid schema artifact, type-generation failure, TypeScript compilation error, or failing consumer test; byte drift from a compatible upstream schema is not itself a failure;
  - let actual client code and the TypeScript type system determine whether a structural change breaks this consumer instead of maintaining a version range or custom semantic-diff rules;
  - use a standard PostgreSQL/OpenAPI AST/schema tool only if a demonstrated compatibility gap cannot be represented by generated types or tests;
  - accept Supabase's current pgvector-to-`string` mapping and omission of the unnamed raw-body `create_storage_blob(bytea)` RPC for Phase 3: the real consumer compiles/tests, and blob transfer already uses explicit raw PostgREST fetches. Add an override only after a typed consumer demonstrates a concrete need;
  - do not require equality with a migration head; record source SHA for provenance and use the resolved image digest as the immutable identity of the selected upstream release;
  - re-resolve `stable` before final success and fail stale if it moved during the run; a normal PR update or a newly formed merge group provides fresh evidence.
- Rebuild `client-web E2E` as an isolated per-job main-runtime test:
  - use the tracked Compose topology to provision pinned pgvector PostgreSQL with a health check and no persistent volume;
  - run the resolved core release once as `db init --profile development` against the fresh database;
  - start that same digest as the real web service and start pinned PostgREST after initialization, then wait for readiness;
  - run browser read/write/deny E2E and retain diagnostics on failure;
  - let runner/container teardown delete all test state; do not create or clean external provider branches;
  - run the core image as the real production-admitted upstream service under integration test, never as the database compatibility contract;
  - never select a core-py pull-request preview, artifact, image, or database.
- Enforce upstream ordering without cross-repository PR linkage. Core and client branches may be developed concurrently, but core-py must merge and successfully deliver first. The dependent client pull request becomes merge-eligible only after current required checks resolve `stable` and fresh contract compilation and integration evidence succeed. Its live-proven merge-group path is available when a permanent queue is warranted. Core contract evolution should remain backward-compatible with current `client-web/main`; use expand/migrate/contract sequencing when a removal would otherwise break the already deployed consumer.
- Split `.github/workflows/pages-deploy.yml` into two authorities:
  - `.github/workflows/pages-preview.yml` listens to successful pull-request validation runs, validates the trusted workflow identity and exact same-repository pull-request head, creates or resets deterministic Neon branch `preview/client-web/pr-N` directly from production, deploys the exact core digest recorded by that validation plus PostgREST against it, downloads the checked environment-neutral web artifact, deploys the matching Pages branch, and runs a focused full-stack smoke. Reviewers continue entering preview endpoints and credentials through the existing browser Settings/localStorage flow; Playwright may inject those values only for automated smoke;
  - `.github/workflows/pages-deploy.yml` becomes the protected-main production workflow, checks out exact `github.sha`, performs a frozen install, builds only `@inkcre/client-web`, validates a web-only release contract, uploads the release artifact, and deploys that same release-run artifact after proving `main` still points to the selected SHA.
- Keep `.github/workflows/pages-cleanup.yml` as the isolated `pull_request_target` cleanup controller with same-repository identity and exact deletion of the Pages preview, Neon branch, and preview core/PostgREST deployment.
- Add `scripts/verify-client-web-release.mjs` as a narrow static-web artifact and environment-neutrality contract. Do not reuse the full package-output contract that requires unrelated browser-extension and remote artifacts.
- Update `scripts/check-local-runtime-contract.mjs` for the new workflow inventory and Node setup anchors.
- Update `tasks/developer-experience-engineering/40-testing-delivery.md` and its active packet so they no longer claim production promotion of a pull-request artifact.
- Keep all four required contexts under their clearer names: `Workspace contract`, `Dependency review`, `client-web E2E`, and `client-webext E2E`. Contract generation/compilation remains covered by `Workspace contract`; `client-web E2E` verifies the real resolved core service against an empty local database. Client preview and production deployment remain separate delivery evidence rather than merge gates.
- Change main protection to enforce administrators and conversation resolution while retaining strict checks and linear history.
- Add a `production` environment custom branch policy for `main`. Keep preview secrets scoped to the `preview` environment and production secrets scoped to `production`; fork pull requests receive neither.
- Set the repository fork-workflow approval policy to `all_external_contributors`. Maintainer approval starts read-only, secret-free CI only; the same-repository guard still rejects every fork from preview delivery.
- Update the repository-local `.github/pull_request_template.md` as an intentional application-profile override containing all organization-required fields plus `pnpm check` and relevant E2E evidence. Do not expect the organization default template to override it.

### `InKCre/ui` Package Profile

- Keep `.github/workflows/ci.yml` as pull-request validation and rename its aggregate required
  context from `Reproducible workspace check` to `ui-web checks`. The job continues to own the
  frozen workspace, generated-output, type, unit-test, build, packed-package, story, and Changesets
  contracts; the simpler context name describes its public scope rather than every internal step.
- Keep `.github/workflows/release-and-publish.yml` as the only package release authority on `main`:
  - serialize runs with one `ui-release-main` concurrency group;
  - use `cancel-in-progress: false` so a publication is never cancelled halfway;
  - continue using the built-in `GITHUB_TOKEN` as `NODE_AUTH_TOKEN` for GitHub Packages.
- Migrate Histoire delivery from Cloudflare's Git pull integration to repository-owned runner push
  without replacing the existing `inkcre-web-design` Pages project or its custom domain:
  - export the current Pages project/build/domain/branch-control configuration before editing; use
    `wrangler pages download config` in a disposable location or the authenticated Cloudflare API,
    review the result, and never copy credentials into the repository;
  - pin Wrangler in the workspace and check in a reviewed Pages configuration derived from the
    existing project, with project name and `packages/web/.histoire/dist` output owned as code;
  - keep `ui-web checks` secret-free and upload its exact successful Histoire output as a short-lived
    artifact;
  - add a trusted `workflow_run` preview controller that accepts only an open, same-repository pull
    request targeting `main` at the exact checked head, downloads that artifact without executing
    pull-request code, and pushes it to deterministic Cloudflare branch `pr-N`;
  - add a trusted close controller that replaces the exact `pr-N` alias with a small `noindex`
    tombstone; accept that older immutable Cloudflare deployments remain reachable;
  - add a protected-main delivery workflow that checks out exact `main`, performs a focused Histoire
    release build, transfers the same-run artifact to a production job, pushes it with Wrangler, and
    smokes `https://design.inkcre.dev`;
  - use repository `preview` and `production` environments, select the existing organization
    Cloudflare credentials for `ui`, and set repository variable `CLOUDFLARE_PAGES_PROJECT` to
    `inkcre-web-design`; separate preview and production tokens are not required for this static site;
  - name repository-owned delivery jobs `ui-web preview`, `ui-web preview cleanup`, and
    `ui-web deployment`; keep them as delivery evidence rather than merge-required contexts.
- Cut over without downtime: keep Cloudflare automatic Git builds enabled while the runner delivery
  foundation lands and proves one main push; prove runner preview on a subsequent non-stacked UI
  pull request, then disable automatic preview and production builds, merge through the runner lane,
  and verify the canonical site and close-time retirement. Previous deployments remain hosted
  throughout the transition. The Cloudflare GitHub App is currently installed for all organization
  repositories, so removing only `ui` access is not a Phase 5 exit condition; audit and narrow that
  installation separately only when the other repositories' usage is known.
- Treat package publication and Histoire delivery as parallel outputs of protected `main`. A failure
  in one lane does not prove the other artifact invalid; record and repair the failed authority
  without republishing the successful output solely to synchronize run IDs.
- Resolve current release pull request #34 before tightening protection:
  - prefer approving its existing `action_required` pull-request run so the PR-only Changesets
    validation executes as well as the workspace check;
  - use manual dispatch against `changeset-release/main` only as a fallback, because the current
    workflow skips Changesets validation for `workflow_dispatch`; pair that fallback with an
    explicit exact-head release-diff/Changesets validation;
  - verify that the successful `Reproducible workspace check` is attached to the exact release pull-request head SHA and GitHub Actions app identity.
- Accept manual approval or dispatch as the initial low-frequency release-PR operating procedure.
- If repeated release-PR updates make that procedure materially costly, automate in a separately approved slice with a dedicated GitHub App installed only on `InKCre/ui`:
  - grant only Contents write and Pull requests write;
  - store the client ID as a repository variable and private key as a repository secret;
  - create the short-lived installation token with an immutable Action SHA and an explicit `repositories: ui` restriction;
  - pass that token through `changesets/action`'s `with.github-token` input;
  - keep package publication on the built-in token;
  - do not use a classic PAT, execute pull-request head code under `pull_request_target`, or synthesize custom required checks.
- After the Phase 5 workflow pull request reports successful `ui-web checks`, atomically replace the
  old required context with `ui-web checks` bound to GitHub Actions app `15368`; do not add a second
  compatibility job. In the same settings slice, extend the existing rulesets so `main` requires a
  pull request, conversation resolution, linear history, the strict required context, and no bypass.
  Preserve deletion and non-fast-forward protection.
- Disable merge commits; retain squash and rebase. Changesets reads the final `.changeset` files, so either method preserves version intent.
- In stacked package work, merge bottom-up and restack before checks. Never use `changeset-release/main` as the base of a feature stack.
- Require maintainer approval before workflows from every external fork contributor run. Approval
  permits only secret-free `ui-web checks`; the same-repository identity gate independently denies
  runner preview delivery to forks.

### `InKCre/docs` Documentation-Site Profile

- Modify `.github/workflows/website-check.yml` to run `Website contract` on pull requests targeting `main` and manual dispatch only. Preserve the check name and upload the checked site artifact for eligible preview delivery.
- Add an isolated pull-request preview lane:
  - a trusted controller listens only to successful `Website checks` pull-request runs;
  - it accepts only an open, same-repository pull request targeting `main` at the exact checked head SHA;
  - it downloads the checked artifact without executing pull-request code under privileged credentials;
  - it deploys a deterministic `preview/docs/pr-N` Cloudflare Pages branch with the existing repository-selected Cloudflare credentials, per-PR concurrency, and `noindex` verification;
  - a separate trusted close controller validates the same-repository pull request identity and replaces the exact preview branch with a trusted `noindex` closed-preview tombstone; older immutable deployments remain in Cloudflare history;
  - fork pull requests remain build/test only and receive no preview credentials.
- Rewrite `.github/workflows/pages-deploy.yml` as one self-contained protected-main delivery workflow:
  - trigger on `push: main`; use GitHub's rerun capability for the same failed release commit;
  - check out the exact selected main SHA;
  - install the frozen website toolchain;
  - run the website release contract and build;
  - transfer the artifact from a secret-free build job to the production deployment job within the same workflow run;
  - prove `main` still points to the selected SHA before delivery;
  - deploy to Cloudflare Pages and run the existing canonical and immutable deployment smoke checks.
- Remove the cross-workflow `workflow_run` identity and artifact-retention dependency. Do not rebuild again inside the deploy job.
- Create repository-level main protection requiring pull requests, `Website contract`, conversation resolution, linear history, no bypass, no force pushes, and no deletion.
- Disable merge commits; retain squash and rebase.
- Keep the existing production environment main-only branch policy and least-privilege Cloudflare credentials.
- Inherit the organization contribution guide and pull-request template; add a local override only if documentation-specific evidence cannot be expressed by the default template.

## Actions and Credential Hardening

- Apply these settings per active scoped repository; do not change organization-wide defaults that would affect repositories outside this task:
  - default workflow token permission `read`;
  - Actions may not approve pull-request reviews;
  - each write-capable job declares only its required permissions;
  - third-party Actions use immutable commit SHAs with a readable version comment.
- Enable repository SHA-pinning enforcement only after every checked-in workflow and composite action passes the pin audit.
- Pilot selected-actions allowlists after behavior changes are stable:
  - allow GitHub-owned Actions and the explicitly used pnpm, PDM, Docker, Cloudflare, Neon, Changesets, and optional GitHub App token actions;
  - include local actions without converting them to remote dependencies;
  - verify generated Dependabot and Copilot workflows before applying the restriction;
  - roll back to the previous allow policy if a required trusted workflow cannot start.
- Keep cross-repository write tokens out of scope. The dedicated optional `ui` release App is repository-scoped and is not a general automation credential.
- Move deploy credentials to repository environments where operationally possible. Production environments accept only `main`; preview environments never expose secrets to forks.

## Execution Sequence

### Phase 0: Evidence Freeze and Preconditions - Completed

- Exported current repository metadata, merge settings, branch protection, rulesets, Actions permissions, environment policies, required-check identities, and workflow SHAs for `.github` and the four product repositories to [`evidence/phase-0`](./evidence/phase-0/README.md).
- Recorded the normalized snapshots, transition/rollback payloads, and SHA-256 manifest task-locally.
- Confirmed each configured required context has GitHub Actions source identity and recent evidence, with current-head exceptions recorded explicitly.
- Confirmed the current blockers rather than weakening policy:
  - `client-web` required checks must be restored to green through their owning dependency/runtime work;
  - `ui` release pull request #34 must receive its exact-head required check.
- Confirmed two sequencing constraints:
  - `.github` has no green verification contract; its stale Pages workflow disposition must be decided in the Phase 1 handshake;
  - the `docs` delivery decision changes Hub truth, so the Hub document must change and publish before the Spoke shared reference is refreshed separately.
- Exit condition: later mutations have explicit `From -> To` and dry-validated rollback fields. Each phase must refresh its snapshot immediately before write because no remote rollback was executed during this read-only phase.

### Phase 1: Publish the Governance Carrier - Completed

- Published `GOVERNANCE.md`, `CONTRIBUTING.md`, the default pull-request template, profile links, and a concise repository map directly to `.github/main` as commit `911e4515916b6c399b856cc89e62631695a5cbf8`.
- Removed the superseded VitePress content, package/lock files, Pages workflow, site configuration, and local site TODOs; the final remote tree contains only the GitHub-native surfaces and `LICENSE`.
- Disabled GitHub Pages, deleted the empty `github-pages` environment, and changed the organization website from the legacy domain to `https://inkcre.dev`.
- Verified the remote SHA/tree, zero active workflows, Pages/environment 404s, canonical website HTTP 200, default `CONTRIBUTING.md`/pull-request-template inheritance for `ui` and `docs`, and intentional local overrides for `client-web` and `core-py`.
- `.github` is not an active repository and is intentionally outside the common branch-protection and merge-policy rollout.
- Rollback: revert commit `911e451` on `.github/main`, restore the prior Pages configuration only if the retired site must be recovered, and restore the prior organization website value from the Phase 0 snapshot.

### Phase 2: Documentation-Site Pilot

- Change and publish the `InKCre/docs` Hub statement for the new protected-main rebuild model first; refresh `client-web/docs/_shared/` only as a separate Spoke reference update under the shared-doc workflow.
- Land the `docs` workflow split through a pull request while the existing check remains visible.
- Observe one successful pull-request `Website contract`, isolated preview delivery and cleanup, and one successful protected-main delivery from source build through Cloudflare smoke.
- Prepare a reviewed revert path, then apply main protection only after the required context and new main delivery are proven.
- Open a disposable documentation pull request to prove a failing required check blocks merge and a corrected latest-head check unblocks it.
- Rollback: revert the workflow change through a pull request and restore the exported classic-protection absence or payload plus merge flags. The previous exact-artifact workflow remains the fallback design.

### Phase 3: Client Application Migration - Completed

Accepted completion differs from the original maximal target in two deliberate ways: live preview
proves the checked static artifact and deterministic Pages alias without provisioning Neon/core/
PostgREST, and the merge queue was enabled only long enough to prove `merge_group` because a permanent
queue would force one merge method. The required local E2E remains the full fresh-database proof;
external-fork GHCR access is recorded as an unproven operational edge rather than a reason to add a
credential or a synthetic fork.

- Land the dependency-audit baseline repair independently from workflow and contract changes.
- Prepare the concise `.github` governance amendment separately, but direct-publish it only after the
  Phase 3 behavior is live-proven. It must describe authority-boundary validation, merge-queue
  admission, renamed checks, and local-CI versus human-preview data without claiming unfinished
  controls; do not mix it into a client implementation commit.
- Treat the current core-py workspace as an ownership/base-selection constraint, not a requirement that its primary worktree become clean. After explicit start, create a separate clean worktree and feature branch from the selected commit, leaving the primary worktree's ten local commits and unrelated task changes untouched. In that isolated worktree, land a core-owned producer-foundation pull request that initializes a separate neutral runtime database, exports its role/schema/lifecycle bundle, uploads an exact source/schema manifest, embeds both in the canonical service image, tests and publishes that image once, and changes production to pull the immutable GHCR digest and transfer it unchanged to Heroku web. Move `stable` only after the exact candidate passes production; do not add downstream dispatch.
- The design spike is complete without source edits: both published `core-py/main` and local `f1b2116` source images initialized empty pgvector databases, produced restorable schema SQL, and generated TypeScript. The older published schema correctly fails the current consumer; the `f1b` schema produces all 19 relations, compiles with the stable adapter, and passes 28 `packages/core` tests. Re-run the same bounded probe against the first real `stable` image; do not redesign the path unless that release exposes a new concrete semantic gap.
- Land a client dependency/E2E pull request that introduces the runtime-parameterized Compose topology and release resolver, removes the bespoke checked source/image/migration tuple, consumes raw schema through mature type generation, runs the resolved real core service against fresh local pgvector/PostgreSQL, and makes the required workflow handle both `pull_request` and `merge_group` events.
- Rebase the useful local delivery slice onto that dependency model, then land PR validation, same-repository Pages preview, focused main release, web-only contract, runtime inventory, documentation, and local template as a separate independently green pull request.
- Migrate required-check names without an administrator bypass. During the workflow pull request, expose `Dependency review`, `client-web E2E`, and `client-webext E2E` while temporary compatibility jobs continue to report the old required contexts from those new results. After the new contexts have succeeded, atomically replace branch protection's required contexts and remove the compatibility jobs in a follow-up pull request.
- Prove all four renamed required contexts on the latest pull-request and merge-group heads: `Workspace contract`, `Dependency review`, `client-web E2E`, and `client-webext E2E`. Also prove same-repository Pages preview delivery/alias retirement and exact-main production build/deploy/smoke as delivery evidence, not merge contexts.
- Exercise the local service chain from empty pgvector PostgreSQL through the declared core release's `db init`, core/PostgREST readiness, browser E2E, failure evidence, and automatic teardown. Prove that it has no production/Neon credentials or persistent data.
- Prove the one-entry merge queue and `merge_group` event against current production-admitted `stable`; keep the resolver's end-of-run alias recheck. A separate live mid-run stable mutation was not manufactured solely for the probe. No client dependency PR, propagation credential, or polling interval participates.
- Set every external fork workflow to require maintainer approval; same-repository preview identity remains an independent deny guard. Live private-GHCR access from a synthetic external fork is deferred rather than exposing a credential to untrusted code.
- Exercise the upstream handoff without pull-request linkage: develop representative core/client changes concurrently, keep the client pull request out of the queue, merge and successfully deliver core-py first, then enqueue the unchanged client head and merge only after fresh merge-group contract compilation and isolated E2E succeed.
- Tighten administrator, conversation, Actions, fork-approval, and merge settings only after the new workflows pass. Remove the temporary merge-queue rule after live proof so optional rebase remains available.
- Rollback: revert the workflow slice through a pull request and restore exported settings. Keep the current production deployment live until a replacement smoke succeeds.

### Phase 4: Core Service Alignment

- Do not use the intentionally unmergeable synchronized product PR #45 as the governance acceptance
  vehicle. Create a dedicated clean branch/worktree from current `core-py/origin/main`, extract only
  the contribution-link and immutable-Action-pin changes, and leave PR #45 draft and unchanged.
- Keep the repository check scoped to program code and infrastructure configuration. Configure Ruff
  centrally to exclude Markdown so populated Hub references and task prose cannot fail the code gate;
  retain actionlint and the existing Python, lock, migration, settings, type, and test contracts.
- Verify all four required contexts plus preview identity/delivery on the small governance pull
  request. Do not copy PR #45's product-specific stale validation repairs into this slice.
- After those checks are green, enable linear history, disable merge commits while retaining squash
  and rebase, and merge the governance pull request through the protected path.
- Use the resulting main runs to verify GHCR publication, exact-current-main production guard,
  production health checks, and movement of `stable`; then verify preview cleanup and remove the
  temporary worktree.
- Rollback: revert documentation/pins through a pull request and restore merge settings. Do not roll back production artifacts solely to undo governance metadata.

### Phase 5: Package Repository Alignment

- Refresh and export UI repository settings plus the current `inkcre-web-design` Cloudflare project
  configuration. Confirm the existing organization Cloudflare credential can address that project;
  if it cannot, stop before cutover and create a project-scoped Pages token rather than weakening the
  workflow or replacing the live project.
- Amend organization governance with the `<scope> <kind>` check-context convention. Apply it only to
  `ui` in this phase; do not reopen completed `client-web` or `core-py` workflow work merely to rename
  contexts.
- Resolve and merge `ui` release pull request #34 under its existing required-context name, with
  exact-head pull-request-event evidence, before changing that name; verify the resulting package
  publication, tag, release, main Release run, Cloudflare main deployment, and canonical Histoire
  site. If the old `action_required` run can no longer be approved, use exact-head manual CI plus a
  separate release-diff/Changesets validation rather than silently omitting the PR-only step.
- Land the runner-CD foundation through the existing `Reproducible workspace check` context. Keep
  every existing Action pin and pin each newly introduced artifact/deployment Action at its reviewed
  immutable commit. Verify the existing `Cloudflare Pages` check and exact-head branch preview while
  the pull integration remains active. After merge, verify the new runner-owned
  `ui-web deployment` against `https://design.inkcre.dev` before disabling either Cloudflare build
  lane.
- Use a second sequential, non-stacked governance/release pull request for the `ui-web checks` rename
  and non-cancelling `ui-release-main` concurrency. Wait for that exact head to report the successful
  new GitHub-Actions-owned context while the old rule still blocks merge. Prove runner-owned
  `ui-web preview` and its deterministic `pr-N` alias, disable Cloudflare automatic Git deployments,
  atomically switch the required context and remaining rules, then merge and verify runner-only
  production delivery and close-time preview retirement before considering any organization-wide
  Cloudflare App access change.
- Record manual exact-head dispatch or approval as the initial operating procedure for low-frequency
  Changesets and design-token pull requests created by the built-in `GITHUB_TOKEN`.
- Do not create synthetic pull requests solely to exercise stacking. Keep the documented bottom-up
  restack procedure available for real stacked work, and validate it only when such work naturally
  occurs.
- Disable merge commits while retaining squash and rebase after the new required context is proven.
- Treat dedicated GitHub App automation as a separate credential-bearing Impact Handshake after manual operating cost is observed.
- Rollback: before disabling automatic Cloudflare builds, retain the exported project/build settings.
  If runner delivery fails before cutover, leave the pull integration active and revert the runner
  workflow through a pull request. If it fails after cutover, re-enable automatic production and
  preview builds first so `design.inkcre.dev` keeps receiving updates, then revert. Coordinate the
  workflow job name and required-context rule so the ruleset never waits for a name the active
  workflow cannot emit; restore the exported rulesets and merge settings as needed. Do not unpublish
  an already successful package solely to roll back Histoire delivery. Revoke the optional release
  App installation and secret if that later slice fails; its issued token expires independently.

### Phase 6: Actions Hardening and Final Audit

- Freeze each repository's Actions settings, fork policy, production branch policy, workflow action references, and rollback payload before mutation.
- Change remaining per-repository workflow defaults to read-only and disallow Actions approval of pull-request reviews. Preserve explicit job-level write grants for release and deployment jobs.
- Require maintainer approval before every external fork contributor's read-only, secret-free workflow run in all four repositories.
- Enforce immutable Action SHAs after confirming every checked-in external Action is already pinned to a full commit SHA; local actions remain local references.
- Add the missing `main`-only branch policy to the `client-web` production environment.
- Treat selected-actions allowlists as optional defense in depth. If justified, probe only `docs` first with GitHub-owned Actions plus exact current third-party action patterns, then restore `allowed_actions=all` on any unexplained workflow-start failure. Do not make the allowlist a Phase 6 exit condition.
- After each repository mutation, run a secret-free manual validation workflow and stop or restore that repository before continuing if it cannot start normally.
- Run a final read-only audit against all common controls, profile-specific workflows, environment policies, templates, required-check sources, and merge methods.
- Record any exception with owner, reason, compensating control, and review date in `GOVERNANCE.md`; do not hide drift in the task packet.
- Exit condition: the final audit has no unexplained difference between the documented standard and live GitHub state.

## Verification Evidence

- File evidence:
  - organization governance, contribution guide, and default pull-request template exist in supported `.github` locations;
  - repository-local overrides link or conform to the organization baseline;
  - workflow triggers, permissions, concurrency, identities, and artifact paths match their profile.
- GitHub API evidence:
  - main protection or rulesets require pull requests, strict named checks, conversation resolution, linear history, no bypass, no force push, and no deletion;
  - merge commit is disabled while squash and rebase are enabled;
  - Actions defaults and SHA-pinning match the approved phase;
  - production environment branch policies accept only main.
- Behavioral evidence:
  - a failed latest-head required check blocks merge;
  - unresolved review conversation blocks merge;
  - an eligible corrected pull request merges through squash by default;
  - pull-request previews are isolated and cleaned without production authority;
  - protected-main release workflows build, identify, deploy or publish, and verify their own outputs;
  - direct administrator push is unavailable under normal configuration.

## Deferred Decisions

- Whether stack frequency justifies a dedicated stacking tool.
- Whether `ui` release-PR friction justifies the dedicated GitHub App automation slice.
- Whether repeated manual settings drift justifies a read-only external audit of the non-active `.github` carrier and active repositories.
- Whether future team growth justifies one required human approval, CODEOWNERS review, merge queues in repositories other than `client-web`, or GitHub Team.

## Platform References

- [Default community health files and repository-local precedence](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)
- [GitHub squash, rebase, and merge-commit semantics](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github)
- [Required status checks on the latest commit](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [GitHub merge queues and `merge_group` workflow events](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
- [`GITHUB_TOKEN` event recursion and workflow-dispatch exceptions](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)
- [Repository ruleset availability and behavior](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [Heroku Container Registry existing-image push and release](https://devcenter.heroku.com/articles/container-registry-and-runtime)
