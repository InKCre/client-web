# Phase 3 Client Application Evidence

## Live acceptance — 2026-08-08

- Core PRs #43/#44 produced main `02a5d2c435208bac9035071434f1dde0b5ee4c78` and production-admitted
  digest `sha256:c54f56ea41c15277823c0fa502b1396b43da023cd6cf087f08aac01bf7c624a4`.
  The canonical image carries the raw role/schema/runtime manifest, and production transfers that
  image content before moving `stable`.
- Client PR #40 restored the v1-compatible product baseline. PR #43 landed stable resolution,
  Supabase typegen, fresh pgvector/PostgreSQL, the real core service, PostgREST, browser
  read/write/deny E2E, renamed checks, and `merge_group`; its local WSL proof passed two browser tests.
- Client PR #45 separated full PR validation, same-repository Pages preview, focused exact-main build,
  same-run artifact delivery, and production smoke. Production run `31255601082` succeeded for main
  `eb8d1cb8`, artifact `9021297108`, digest
  `sha256:58397930598f8952f9f48dec426df3178fe49a9cacefdc9c54ffbce62876a49d`, and Cloudflare
  deployment `92602810-54dc-4b88-aa0a-f80a3502a16b`.
- Probe PR #46 produced preview run `31255804964`, deployment
  `d6409083-898f-459c-8ade-3b1f9d524006`, and stable alias
  `preview-client-web-pr-46.inkcre-client-web.pages.dev`. PRs #47/#48 changed close cleanup to a
  trusted no-store/noindex tombstone and isolated Wrangler from the pnpm catalog workspace. Manual
  cleanup run `31256442627` and automatic cleanup run `31256837743` succeeded; the PR #46 alias now
  serves the closed page while immutable history remains.
- Branch protection now requires `Workspace contract`, `Dependency review`, `client-web E2E`, and
  `client-webext E2E`, bound to GitHub Actions app `15368`, with strict latest-base policy,
  administrator enforcement, conversation resolution, linear history, no force-push, and no deletion.
  Merge commits are disabled; squash and rebase remain enabled. Actions default to read, cannot
  approve PR reviews, and all external contributors require run approval.
- PR #49 first passed all four direct contexts on its PR head, then entered temporary repository
  ruleset `20585454`. Merge-group run `31256717813` passed all jobs on synthetic commit
  `cc857104e07cc41bc77db19acf75676b0cb22d15`, and GitHub queued/squashed that exact commit to main.
  The temporary rule was deleted after proof so squash remains a convention rather than a forced
  method. Production run `31256836894` and automatic preview retirement both succeeded afterward.
- The synchronized product work is preserved without rewriting history: client snapshot
  `feat/synchronized-core-v3-snapshot`, mergeable draft client PR #50, original core branch
  `feat/synchronized-client-v3`, core snapshot `feat/synchronized-client-v3-snapshot`, and mergeable
  draft core PR #45. Their checks may remain blocked until core v3 is reviewed and admitted; GitHub
  conflict freedom, rather than false-green compatibility, is the recovery acceptance condition.
- Deferred evidence is explicit: no live external fork was created to prove private GHCR pull access,
  and client preview does not yet provision Neon/core/PostgREST. The repository setting and
  same-repository guard enforce the intended basic boundary without adding credentials or lifecycle
  machinery solely for a probe.

## Live baseline

- `client-web/main` is `83242935721b506a2caa40dd278bae6aba19c3d0`.
- Draft pull request #39 remains the isolated `docs/_shared` gitlink bump at
  `66f7fd9d66846b23a79a9be931c7ed15b63310b2`.
- Run `31174353462` proves that #39's dependency review and browser-extension checks pass while the
  workspace and peer-database checks fail on pre-existing main conditions.
- The dependency-audit failure is `fast-uri <3.1.5`, `brace-expansion <5.0.9`, and
  `js-yaml <4.3.1`. No open Dependabot pull request contains all three patched resolutions.
- The peer-database failure occurs before E2E. `contracts/core-py.json` expects contract revision v3
  and one migration head from source `f1b211661cbedf3600584ec9d27cbdf2628322f1`, but the pinned GHCR
  digest is the older v1 artifact published from `0a477db051665e0bb5a3faa888c9d9415cc084f8` and does not emit
  `migration_heads`.
- The primary core-py workspace still contains unrelated in-progress changes. Phase 3 therefore uses
  the clean `/Volumes/WorkSSD/Development/InKCre/core-py-phase3` worktree from `origin/main`; the
  primary worktree remains untouched.

This remains useful failure evidence, but its original exact-tuple repair conclusion is superseded.
The client does have a real upstream dependency: its generated database types and browser behavior
must match a production-admitted core service. That dependency should be discovered through the
`stable` OCI release channel and freshly validated at merge admission, not encoded as a custom
equality rule over source SHA, migration head, contract JSON, and image digest.

## Local implementation checkpoint — 2026-08-08

- Core producer branch `feat/phase3-core-release` starts at `56b1ab216a99e9da863f888b65c02e8e7b7ae9d7`.
  It initializes a separate neutral runtime database and creates `database-schema.sql`, password-free
  role definitions, runtime metadata, and a hashed manifest. The schema file contains the complete
  definition plus only the Alembic and contract-state rows needed to resume lifecycle initialization;
  the canonical service image carries that bundle.
- The canonical image has no ENTRYPOINT and one complete default service command. CI builds it with
  `linux/amd64` and `--provenance=false` for Heroku registry compatibility. Production pulls the
  exact published digest, uses command overrides for one-shot database work, transfers the same
  local web image to Heroku, and moves `stable` only after release/readiness/smoke succeed.
- Client contract branch `feat/phase3-client-contract` starts at `83242935721b506a2caa40dd278bae6aba19c3d0`.
  It replaces the custom relation compiler with Supabase CLI `2.112.0`, raw
  `database.generated.ts`, and a five-export handwritten adapter. The raw Supabase probe remains
  `248d8ec3…`; repository formatting produces the checked `ebc491b5…` file. No probe SHA becomes
  runtime selection truth.
- The client workflow resolves `stable` to a digest in one job, supplies that digest to Workspace
  and real-service E2E, rechecks the alias before success, and adds `merge_group`. New check names
  coexist with temporary jobs reporting the three old required contexts.
- Local evidence: core `pdm run check` passed 158 tests; focused producer tests passed 7; core
  workflows pass actionlint and composite YAML parsing. Client static contract checks, actionlint,
  formatting/linting, and all 71 unit/runtime tests pass. WSL Docker regenerated the accepted
  19-relation Supabase output without installing Docker on macOS. The aggregate client `pnpm check`
  cannot pass its install preflight in the isolated worktree without a GitHub Packages token for
  private `@inkcre/ui-web`; this is recorded as an environment boundary, not bypassed.
- This checkpoint is implementation evidence, not live release evidence. `stable` does not yet
  exist and the remote main schema remains v1, so a real stable-resolution/typegen/E2E success must
  wait for the upstream core release sequence rather than being simulated or weakened.

### Producer-to-consumer restore probe

- A later WSL Docker probe exercised the implemented boundary rather than only type generation:
  core-py initialized the neutral export database, the client restored its role/schema bundle into a
  second fresh pgvector database, and the real core image ran `db init --profile development` against
  that restored database.
- The probe exposed and fixed three real integration defects before publication: the artifact-copy
  container needed explicit write authority for the fresh named volume; restore commands needed
  `-h postgres` instead of the image-local socket; and a definition-only dump did not preserve the
  Alembic/contract-state lifecycle position. The final bundle therefore contains only those lifecycle
  rows in addition to schema definitions, never application rows.
- Restored login roles intentionally carry no password. Core initialization now always reconciles
  configured local passwords while preserving the artifact's neutral, secret-free role definitions.
- The producer workflow now repeats that restore/init/readiness path in a second fresh pgvector
  container before a successful run can authorize artifact publication, so a malformed bundle cannot
  become `stable` merely because its manifest hashes are internally consistent.
- Final readiness reported catalog, environment, migration, privilege, role, and seed checks as
  healthy. Core web started, and unauthenticated PostgREST access returned the expected `401` deny.
  The probe did not claim current browser-write compatibility: remote core main still represents the
  older v1 surface, so the full client E2E must wait for a real v3 production-admitted `stable` image.

## Database-boundary revision

- `client-web` does not consume core-py source code. It consumes raw PostgreSQL schema owned by
  core-py and executes the production-admitted stable core OCI release as the real upstream service in integration
  tests. The container is a release/dependency transport; the PostgreSQL schema remains the database
  compatibility interface.
- The current contract JSON and `generateDatabaseTypes()` implementation are bespoke. They are useful
  evidence of the required output but are not accepted as the target DSL/compiler.
- PostgreSQL schema/catalog is the native DSL. Core-py should export neutral raw schema SQL from an
  actually migrated database and include it in the immutable service image; it should not generate
  client-web TypeScript or publish a second client-specific package.
- Client-web can restore that neutral artifact into a disposable PostgreSQL type-generation
  environment and use Supabase CLI, which officially supports generating the same
  `Database`/`Tables`/`Row`/`Insert`/`Update` TypeScript shape from a self-hosted PostgreSQL URL. The
  repository already uses `@supabase/postgrest-js`. A bounded prototype must verify coverage of the
  exposed `inkcre` schema, relationships, and functions before replacement.
- A plain floating lookup makes existing pull-request evidence age when core changes. That is
  acceptable while the pull request remains only a candidate. The revised model resolves mutable
  `stable` to one immutable digest in ordinary PR validation for early feedback, then resolves it
  again in a required `merge_group` run immediately before admission. It does not broadcast reruns to
  every open candidate.
- The opaque `v1`/`v2`-style schema revision remains sufficient; there is no client compatibility
  range or OCI version negotiation. Actual consumer compilation is more reliable than duplicating the
  type system in a handwritten compatibility engine. If a concrete gap later remains, prefer a
  standard PostgreSQL/OpenAPI AST/schema compatibility tool.
- Browser E2E uses a fresh per-job local runtime. GitHub Actions provisions the pinned pgvector
  PostgreSQL service; the immutable image selected by core-py's production-admitted `stable` channel performs
  `db init --profile development` and then runs the core web process; pinned PostgREST serves the
  browser API. The job starts from an empty database and is destroyed with the runner.
- `client-web E2E` remains required because this design removes external preview/provider
  availability and production-data lifecycle from the check. A failing initialization, readiness,
  read, write, or deny assertion is a real merge failure. The resolved image runs as the real upstream
  service under integration test; it is not the database compatibility contract.
- Do not branch from production data in the required E2E lane. The human preview intentionally uses
  a PR-lifetime Neon branch derived from production; a sanitized intermediate parent is not part of
  Phase 3.
- Upstream ordering replaces pull-request coordination. Core and client branches may be developed
  concurrently, but the client pull request remains ineligible until core-py has merged and
  successfully moved `stable` first; client-web then validates its prospective merge against the immutable
  current delivery in the merge queue.
- GitHub does not automatically invalidate a client check when core-py changes. Dependabot and
  Renovate were evaluated as mature dependency-update mechanisms, but their polling/update-PR model
  adds machinery without protecting the selected boundary and is not the selected design.
- GitHub's native merge queue forms a synthetic commit from current `main` and queued changes, emits
  `merge_group.checks_requested`, and waits for required checks on that commit. Public organization
  repositories can use this on GitHub Free. The workflow must report all required contexts for both
  pull-request and merge-group events; Dependency Review receives explicit base/head SHAs on the
  latter.
- This is an authority-boundary rule: spend freshness where stale evidence becomes consequential.
  Open pull requests may display older upstream evidence because they have no merge authority. Preview
  publication, merge admission, and production delivery each revalidate at their own side-effect
  boundary. Core delivery also remains backward-compatible with current client main; a breaking
  removal uses expand/migrate/contract sequencing because no cross-repository check can provide an
  atomic lock across the final milliseconds of two independent repositories.

## Agreed end-to-end workflow

- Feature work uses a branch and a pull request to `client-web/main`; a dependent stack names its
  immediate parent and is merged bottom-up.
- PR and `merge_group` validation each resolve current core `stable` once, use that immutable digest
  throughout the tracked Compose topology, record the identity, and reject success if the alias
  changes during the run. PR evidence is early feedback; merge-group evidence is admission authority.
- Keep `Workspace contract` and rename the other required contexts to `Dependency review`,
  `client-web E2E`, and `client-webext E2E` when branch protection is migrated to newly observed
  successful contexts.
- Contract/type evidence belongs to `Workspace contract`. Fresh pgvector + resolved stable core service +
  pinned PostgREST read/write/deny evidence belongs to `client-web E2E`.
- A successful same-repository PR may deploy its checked client artifact to
  `preview/client-web/pr-N`. The human preview additionally owns a production-derived Neon branch and
  matching resolved core/PostgREST service. The static artifact remains environment-neutral;
  reviewers use the existing browser Settings/localStorage flow, while automated smoke may inject the
  same values through Playwright. Closing the PR retires only those deterministic resources.
- All external fork contributors require maintainer approval before Actions run. Approved fork runs
  remain read-only and secret-free and never receive preview delivery.
- Merge requires successful merge-group checks and resolved conversations, initially with zero
  required human approvals. The queue uses squash; rebase remains available while maintaining a stack
  before queue admission.
- Protected-main merge starts a focused `@inkcre/client-web` build and deploys the artifact produced
  in that same release run. It does not promote the PR artifact or rerun database and extension
  validation on main.
- A client change that depends on core-py stays out of the queue until core merges and delivers first.
  The unchanged client head is then queued and validated against current `stable`. No core PR
  artifact/linkage, client dependency-update PR, polling workflow, receiver, or cross-repository App
  is part of the baseline.

## Isolated local slices

### Required-check baseline

- Worktree: `/Volumes/WorkSSD/Development/InKCre/client-web`
- Branch: `agent/restore-client-baseline`
- Scope: `pnpm-workspace.yaml` and `pnpm-lock.yaml` only; the task packet remains untracked.
- Verification: frozen install, `pnpm audit:dependencies`, and full `pnpm check` pass locally.

### Workflow migration

- Worktree: `/Volumes/WorkSSD/Development/InKCre/client-web-phase3`
- Branch: `feat/phase3-client-workflows`
- Scope: PR-only full validation, separate exact-head preview delivery, focused exact-main release,
  narrow static release contract, runtime inventory, application delivery truth, and local PR
  template.
- Verification so far:
  - frozen install passes;
  - YAML parsing and actionlint 1.7.7 pass for all four tracked workflows;
  - workspace and local-runtime contracts pass;
  - `pnpm --filter @inkcre/client-web build` passes;
  - `pnpm check:release:web` passes.

The delivery split and static-web release work remain useful local evidence. The database portion of
this slice still preserves the old checked source/image/migration tuple, and the preview is static-only;
it is therefore not publication-ready. It must adopt the runtime-parameterized Compose topology,
stable-release resolver, `merge_group` validation, mature generated types, renamed checks, real
local core service E2E, and the production-derived Neon full-stack preview.

The final preflight review narrows how this worktree should be reused:

- Preserve the PR-only trigger change, trusted preview identity/reverification, exact-main focused
  build, same-run production artifact, web-only release verifier, runtime-inventory update, and local
  pull-request template.
- Rewrite the CI database lane around the resolver/shared release manifest and real core service;
  extend the static preview controller with Neon plus matching core/PostgREST; and extend cleanup to
  those exact resources.
- Add schema/type generation, Compose topology, `merge_group`, and temporary check-name
  compatibility jobs before trying to publish the slice.
- Rebase or transplant coherent hunks after the dependency model lands. Do not merge this entire
  worktree first and then retrofit the old exact tuple, because that would temporarily publish a
  workflow already known to be conceptually obsolete.

Neither slice is committed or published. Live preview, cleanup, production delivery, and repository
settings remain intentionally unmodified until the local diff is reviewed and publication is
explicitly authorized.

## Pre-implementation probes on 2026-08-08

### Producer release handshake

- Current `core-py/main` is `56b1ab216a99e9da863f888b65c02e8e7b7ae9d7`. Its successful
  repository run `30198145873` completed at `10:23:46Z`; artifact publication run `30198190103`
  and production run `30198190112` both started two seconds later with that exact `head_sha`.
  Artifact publication completed at `10:24:55Z` and production completed at `10:28:14Z`.
- The two delivery workflows are parallel children of `Repository and artifact checks`; neither
  proves that the other succeeded. More importantly, they build different Docker targets in separate
  runs: GHCR publishes `artifact`, while production rebuilds `heroku-web`, `heroku-release`, and
  PostgREST. Current exact-source checks therefore prove source identity, not one deployable image.
- The accepted main-release shape builds and tests one canonical core service image, publishes it to
  GHCR, resolves its immutable digest, then makes production pull and transfer that same image content
  to Heroku web. The workflow chain becomes repository checks (level one), artifact publication
  (level two), and production (level three), rather than two parallel release children plus a join.
  PostgREST remains separate. A successful production probe moves `stable` in the production run;
  no cross-repository propagation level is needed.
- The current private GHCR package has no `stable` tag. Its newest digest is
  `sha256:24b717f0cceffe0ba24e2a40dd28d783beb04bc870104d23208f99e13981cc26`, tagged only
  with the exact main SHA and `main`. Moving `stable` is therefore a new release operation, not a
  rename of an existing contract.
- `stable` is a mutable production-state channel, not the image identity consumed by a job or a claim
  that the image is bug-free. It points to the canonical core image currently active after successful
  production admission; a successful rollback moves it back to the restored digest. The current
  artifact publisher moves `main` immediately after artifact publication, before the independent
  production workflow has proved success. The new release moves `stable` only after the exact
  candidate passes production; each consumer then resolves it once and runs the immutable digest.
  Docker's `latest` is only the default tag when no tag is supplied and is mutable like any other
  normal tag. Reusing it would hide the admission meaning and make accidental unqualified pulls look
  valid. `latest` is not selected because it does not carry this admission meaning.
- Existing same-repository and Dependabot validations have already pulled the private core package
  with `packages: read`, so ordinary client PR access is proven. No external-fork run exists to prove
  the approved-fork path; package visibility/access remains a targeted live gate rather than a reason
  to preemptively add a secret or make the package public.
- The neutral schema artifact should be generated in the existing core CI artifact job after its
  fresh database has been migrated, uploaded with an exact source/schema manifest, and downloaded by
  the protected-main release before its one canonical image build. The release then runs the relevant
  runtime contract against that exact image before publication. This avoids a second migration/build
  topology and makes the published and Heroku-transferred OCI image carry the checked schema evidence.

### Canonical image and failure interpretation

- Current `core-py/Dockerfile` defines `artifact` from `runtime`, but `heroku-web` and
  `heroku-release` from a later `heroku-runtime` stage that installs curl and changes entrypoint/CMD.
  `.github/workflows/artifact-publish.yml` builds and pushes `artifact`; the independent production
  workflow rebuilds all Heroku targets from source. They are not currently the same image.
- Heroku officially supports pushing an existing image: pull the exact GHCR digest, tag that local
  image as `registry.heroku.com/<app>/web`, push, and release it. The source artifact should therefore
  be built/tested once and transferred, not reconstructed. Because two registries may normalize or
  report manifests differently, the durable claim is identical image content/config/layers and source
  lineage, backed by both registry/release identifiers—not necessarily one identical digest string.
- The canonical image is the core web/runtime artifact. PostgREST remains separately built because it
  is a different program. Database initialization can invoke the same canonical core image with an
  explicit command; the exact Docker target/CMD cleanup remains implementation work.
- A GHCR push success proves that the candidate is addressable and immutable at its digest. It does
  not prove production correctness. The main release's image contract adds test evidence, while
  Heroku release/readiness/smoke adds environment admission evidence.
- Failure is classified by the first failed boundary:
  - registry authentication, transfer, Heroku API, or platform availability before release points to
    delivery infrastructure; retry the same digest without rebuilding;
  - database initialization, release phase, process boot, readiness, or smoke can still expose an
    image defect or image/environment incompatibility; publication success cannot clear the image;
  - in both cases the immutable SHA candidate remains available for diagnosis, current production
    remains or rolls back, and `stable` does not move.

### Superseded propagation spike

- Read-only research confirmed there is no dedicated dependency-propagation App and that core-py's
  repository `GITHUB_TOKEN` cannot write Actions state in `client-web`. A narrow no-webhook App and
  consumer rerun receiver were technically feasible, and the live PR inventory proved rerun selection
  could be implemented.
- That design solved the stronger UX requirement “refresh every open PR immediately,” not the actual
  correctness requirement “do not admit a stale incompatible merge.” It also had rerun-age,
  old-workflow-definition, credential, and fan-out edge cases.
- The accepted merge queue removes the entire cross-repository credential/receiver surface. Existing
  PR evidence can age harmlessly; the synthetic merge-group commit is the fresh consequential proof.
  Fine-grained PATs, polling, dependency-update PRs, reusable workflows, deploy keys, and synthetic
  client commits remain rejected alternatives.

### Core worktree isolation

- Isolation does not require the existing `/Volumes/WorkSSD/Development/InKCre/core-py` worktree to
  become clean. It means creating a separate clean worktree and feature branch from an explicitly
  chosen base, leaving the user's current files untouched.
- The existing core worktree is the only registered worktree, is `main` at `9930977`, is ten commits
  ahead of `origin/main`, and has unrelated task-document changes. A new worktree can start at
  `origin/main` or at an explicitly selected local commit; that base decision matters because the
  schema spike's v3 source exists in the local commit chain but is not the production-admitted remote main.
- Creating the branch/worktree and implementing core changes remain source mutations and still need
  an explicit start. The dirty primary worktree itself is not a technical blocker once the base is
  chosen.

### Merge-queue admission probe

- GitHub documents that a required merge queue creates a synthetic group commit from current main and
  queued changes, emits `merge_group.checks_requested`, and waits for the same required contexts on
  that commit. The repository's Actions workflow must opt into `merge_group`; otherwise the queue
  waits for checks that never appear.
- The pinned `actions/dependency-review-action` v5 natively resolves `merge_group` base/head refs.
  The workflow uses that maintained implementation instead of duplicating the webhook payload map;
  the other required jobs check out the synthetic group commit normally.
- Initial queue settings should favor observability over throughput: squash, build concurrency one,
  one pull request per group, and all entries required to pass. This project does not need batching
  optimization before the single-entry behavior is live-proven.
- No live queue was enabled during the read-only probe. Settings mutation waits until the workflow can
  produce all four required contexts for an actual merge group.

### Schema restore and type-generation spike

- The source worktrees were not modified. Docker ran remotely through Docker Desktop on
  `wsl.win-ws.localhost`; no desktop Docker installation was added. The probe used Docker `28.5.2`,
  Node `22.22.3`, Supabase CLI `2.112.0`, PostgreSQL `17.10`, and the already selected pgvector image
  `pgvector/pgvector@sha256:d2ef61f42ef767baa5a1475393303cc235bcd92febd9d7014eddb48b41f3bad0`.
- A later network probe tested the exact typegen access path. Publishing PostgreSQL only to
  Docker Desktop loopback and placing both containers in host-network mode each failed because the
  Windows/Desktop and Docker-VM host namespaces differ. Publishing one random job-local port and
  connecting the pinned Supabase pg-meta container through `host.docker.internal` succeeded with a
  fresh 64-hex password, producing the expected schema types. The final script uses that proven
  gateway pattern and removes all temporary containers.
- A source image built from published `core-py/main`
  `56b1ab216a99e9da863f888b65c02e8e7b7ae9d7` initialized an empty database, passed runtime
  readiness, produced a restorable 12-table schema, and generated Supabase TypeScript. Compiling the
  current client against that output failed on absent `storage_blobs` and `peers` relations. This is
  the desired compatibility signal: current client code cannot merge against the older production-admitted
  schema merely because an opaque revision string exists.
- The same probe against the local, uncommitted-to-main contract source
  `f1b211661cbedf3600584ec9d27cbdf2628322f1` migrated an empty database through the single head
  `c0d1e2f3a4b5`, passed runtime readiness, and produced a full schema dump with 19 exposed tables and
  three exposed-schema routines. Restoring that SQL into a second empty pgvector database reproduced
  the same catalog surface.
- PostgreSQL 17 plain dumps contain a random `\\restrict` token by default. Using the official
  `pg_dump --restrict-key=<source-sha> --schema-only --no-owner --no-privileges` option over the whole
  database produced byte-identical repeat dumps while retaining the `vector` extension and
  `inkcre_internal` dependencies. A single `--schema inkcre` dump is not sufficient for this
  contract.
- The canonical `f1b` schema dump is 1,089 lines/27,950 bytes with SHA-256
  `f0ed72101b17de73a98f53fcd41032c10e591437972ba805a5c4d19f8397c046`. Two Supabase generations
  from the restored database were byte-identical at 760 lines/20,306 bytes with SHA-256
  `248d8ec32703bc0e1f8c068ba4735bd0ea5d1e2b7d66c3d80df71e45d66276af`.
- Raw Supabase output needs only the repository formatter and a stable handwritten adapter that
  re-exports `Database`/`Json` and defines `InkcreSchema`, `RelationName`, and `RelationRow`. With
  that adapter, `tsc --noEmit` passed and all 28 tests across 11 `packages/core` test files passed.
  No custom schema DSL, schema-to-TypeScript compiler, or handwritten compatibility classifier is
  justified.
- An AST surface comparison found all 19 current relations in the Supabase output. Supabase also
  preserved relationships, the real `sourcecollectjobstatus` enum, and the typed
  `read_storage_blob`/`renew_peer_lease` RPCs. It maps pgvector columns to `string` rather than the
  current generator's `Array<number>`, and it omits the unnamed-argument raw-body
  `create_storage_blob(bytea)` RPC. Current code does not use those surfaces through the typed
  PostgREST client: blob RPCs use explicit raw fetches, and the generated replacement still compiles
  and passes tests. Record these as known generator semantics, not reasons to preserve the bespoke
  compiler.
- The current production-admitted core image still does not contain this artifact, and the local `f1b` source
  is not a published main release. Implementation must reproduce the same probe against the actual
  exact-main `stable` image before the new required gate is declared live.

## Simulated rollout order

1. Land the already isolated dependency-audit baseline repair; do not mix task files or pull request
   #39 into it.
2. Once the core worktree can be isolated, land a core producer-foundation pull request: generate the
   neutral schema artifact in CI, embed it plus opaque schema/source metadata in one canonical image,
   test and publish that candidate, then transfer the same image content to Heroku web. Promote
   `stable` only after production smoke.
3. Re-run the now-proven schema-restore/Supabase-generation path against that real `stable` image,
   then land the client resolver, formatted generated types plus stable adapter,
   runtime-parameterized Compose chain, real-service E2E, and `merge_group` validation.
4. Rebase and land the client delivery split: PR validation, Neon-backed same-repository preview,
   focused exact-main web release, runtime inventory, application-delivery truth, and local PR
   template.
5. During check-name migration, emit the three old required contexts as temporary compatibility jobs
   backed by the new jobs. After the new contexts have succeeded and branch protection is switched,
   remove the compatibility jobs in a follow-up pull request. Never depend on administrator bypass to
   rename a required check.
6. After all four contexts have appeared on a live `merge_group`, require the client merge queue with
   squash, concurrency one, and one PR per group. Prove a stale open PR resolves a newly stable core
   digest only when queued.
7. Only after live validation, apply the remaining conversation/admin/environment/fork-approval
   settings and publish the matching `.github` governance amendment.

## Live producer rollout and first consumer probe (2026-08-08)

- Core pull request [#43](https://github.com/InKCre/core-py/pull/43) established the schema-bearing
  canonical service image and production-admitted `stable` flow. Required checks and full
  Heroku/Neon preview passed before squash merge `8e805d807d62b2c699e2ca2ad42ab96934987f40`.
  Exact-main CI run `31251721510` and artifact publication run `31251784473` passed. Its production
  run exposed an archived storage-only Neon recovery branch before any database or Heroku mutation,
  so `stable` correctly remained unchanged.
- Core hotfix pull request [#44](https://github.com/InKCre/core-py/pull/44) kept production branch
  identity, parent, name, no-TTL, and ready-state checks while accepting either `ready` or
  provider-archived state for the storage-only recovery checkpoint. Required checks and preview
  passed before squash merge `02a5d2c435208bac9035071434f1dde0b5ee4c78`.
- Exact-main CI run `31252293576`, publication run `31252355184`, and production run
  [`31252405658`](https://github.com/InKCre/core-py/actions/runs/31252405658) all passed. Production
  smoke observed anonymous `401`, authenticated read `200`, write `201`, cleanup `204`, and
  wrong-secret `401`. Only then did the workflow move `stable`.
- GHCR package metadata now binds `stable`, `main`, and commit
  `02a5d2c435208bac9035071434f1dde0b5ee4c78` to immutable digest
  `sha256:c54f56ea41c15277823c0fa502b1396b43da023cd6cf087f08aac01bf7c624a4`.
  This proves the production-admission channel mechanics and exact image reuse.
- The first downstream resolution and fresh-runtime probe used that digest through the existing WSL
  SSH Docker provider. It found and fixed an independent Unix-socket-length defect by deriving a
  short `/tmp` control-socket path from the repository/runtime identity. Fresh pgvector restore,
  init, core readiness, PostgREST readiness, SSH forwarding, and cleanup then ran far enough to make
  the real consumer request.
- The request correctly failed: `PATCH /peers` returned `404`. Inspection of the released image
  showed manifest revision `peer-database-runtime-v1` and a raw schema containing the older 12-table
  surface with no `peers` relation. This is not a workflow false negative or an authorization bug.
  Current `client-web/main` already contains peer/capability consumers introduced against the local
  core commit `f1b2116`, while that core series remains ten local product commits ahead of the
  production branch.
- Therefore the remaining blocker is upstream product ordering. The owner-selected peer/capability
  core series must enter protected `core-py/main`, pass production, and move `stable` before the
  client contract/E2E pull request can receive truthful green evidence. Phase 3 must not weaken the
  E2E, fabricate the missing schema in client-web, or publish the roughly 179-file core feature
  series under workflow-only authority.

## Failure rehearsal

- Core schema export or core CI fails: artifact publication and production never start. Fix the core
  pull request; `stable` stays unchanged.
- Candidate publication succeeds but transfer fails before Heroku release: `stable` does not move.
  Retry the same GHCR digest; do not rebuild merely to retry registry/network/platform work.
- Heroku release, database initialization, boot, readiness, or smoke fails: publication success does
  not clear the candidate. Diagnose image/environment compatibility, keep or restore existing
  production, and leave `stable` unchanged.
- `core-py/main` advances before production admission: the older immutable candidate remains
  diagnosable, but only the selected release may move `stable` after exact-main policy is applied.
- `stable` moves during PR or merge-group validation: the run fails stale. A normal PR update or a
  newly formed merge group resolves the new digest.
- An open PR has old green evidence after core delivery: no action is required. Queue admission runs
  fresh checks; a failure removes the entry instead of merging it.
- A merge-group required check fails or never appears: GitHub removes or blocks the queue entry. Fix
  the workflow/consumer/upstream and enqueue again; never bypass the queue.
- PR preview fails after validation: merge checks remain truthful and Deployment evidence is failed
  or missing. Rerun preview or review without it; no production mutation occurred.
- Focused main release fails: existing production remains live. Rerun or fix the exact main release;
  never promote the PR artifact.

## Open implementation decisions

- Whether a future consumer actually requires pgvector columns as `Array<number>` through the typed
  PostgREST client. The current consumer compiles/tests with Supabase's `string` mapping, so no custom
  override is part of Phase 3.
- Exact path for the tracked Compose topology and the raw schema SQL/release metadata inside the core
  image.
- Exact filenames/manifest fields for the neutral schema artifact generated by core CI and embedded
  in the runtime image.
- Whether current package settings grant approved client validation enough Read access to the private
  core-py GHCR package, or whether this public-source runtime artifact should be public.
- The exact Docker target/entrypoint/CMD simplification that lets one canonical image serve GHCR,
  Heroku web, and one-shot database commands without retaining separately rebuilt core-code images.
- Live proof of the GHCR digest-to-Heroku image/release lineage and which identifiers Heroku preserves
  after registry transfer.
- Live proof that all four required GitHub Actions contexts, including Dependency Review with explicit
  base/head refs, report on an actual merge-group commit.
- Exact Playwright-only localStorage bootstrap used for full-stack preview smoke; application runtime
  bootstrap remains out of scope.
- Whether the core artifact's default `web` command and current one-shot `db init` plus pinned
  PostgREST startup are cleanly expressible in one Compose topology with an init dependency.

## Tooling research

- [PostgreSQL `pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html) can produce a
  schema-only SQL script that reconstructs database object definitions. The official documentation
  also warns that a single-schema dump may omit objects on which that schema depends, so the spike
  must prove the required extension/cross-schema closure rather than assuming `--schema inkcre` is
  self-contained.
- [Supabase documents database introspection and TypeScript generation](https://supabase.com/docs/guides/api/rest/generating-types)
  for hosted, local, and self-hosted PostgreSQL databases, including `--db-url` and `--schema`.
- [Supabase CLI pull request #906](https://github.com/supabase/cli/pull/906) records that `--db-url`
  type generation runs pg-meta with host-network access. The WSL probes above additionally bound the
  Docker Desktop gateway behavior that the upstream Linux-oriented change does not make identical.
- [GitHub documents PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
  for Linux runners, including health checks, port mapping, and automatic job-scoped lifecycle. The
  current core-py CI already uses this model with the pinned pgvector image.
- [GitHub merge queues](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
  are available to public organization repositories and require the relevant Actions workflow to
  handle `merge_group` for final queue checks.
- [`actions/dependency-review-action` pull request #766](https://github.com/actions/dependency-review-action/pull/766)
  added maintained `merge_group` ref resolution; the selected v5 action owns that event mapping.
- [GitHub Container Registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
  recommends pulling an exact version by digest when the same image must be guaranteed.
- [Heroku Container Registry documentation](https://devcenter.heroku.com/articles/container-registry-and-runtime)
  supports tagging and pushing an existing image to `registry.heroku.com/<app>/<process-type>` before
  release; it also documents its image-manifest/runtime constraints.
- [Docker documents tags versus digests](https://docs.docker.com/dhi/explore/security-concepts/digests/):
  ordinary tags, including `latest`, can move; a digest is immutable.
- [Dependabot version updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates)
  and [Renovate Docker updates](https://docs.renovatebot.com/docker/) remain evaluated alternatives;
  neither polling/update-PR mechanism protects admission as simply as the merge queue.
- [PostgREST can expose its database-derived HTTP surface as OpenAPI](https://postgrest.org/en/v11/references/api/openapi.html),
  but its documented response is Swagger/OpenAPI 2.0. Current
  [`openapi-typescript` 7.x](https://openapi-ts.dev/introduction) targets OpenAPI 3.0/3.1, so adopting
  that path would add a conversion/version constraint and is not the first prototype.
