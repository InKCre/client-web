# Phase 0 Transition and Rollback Baseline

This file converts the captured live state into bounded later mutations. It does not authorize them. Workflow restoration uses reviewed Git reverts; setting restoration uses the captured values below. Secret values cannot be exported and therefore require a separate owner-confirmed procedure.

## Phase 1 - `.github` Control Plane

- Files:
  - From: no `GOVERNANCE.md`, `CONTRIBUTING.md`, or default pull-request template; profile and legacy workflow prose are blobs `4f975285...` and `7472bc3b...`.
  - To: add the three default community files, link them from `profile/README.md`, and replace the stale workflow prose with a compatibility pointer.
  - Rollback: revert the reviewed governance commit through a pull request. Preserve a compatibility pointer instead of restoring stale normative workflow prose.
- Repository settings:
  - From: merge/squash/rebase all enabled; no main protection or ruleset; automatic branch deletion disabled.
  - To: merge commit disabled; squash and rebase retained; main requires a pull request with zero approvals, administrator enforcement, conversation resolution, and linear history; force push and deletion disabled; no required status check yet.
  - Rollback: remove the new protection to restore the captured absence, then restore `allow_merge_commit=true`, `allow_squash_merge=true`, `allow_rebase_merge=true`, `allow_auto_merge=false`, and `delete_branch_on_merge=false`.
- Blocking decision:
  - Current tracked Pages workflow blob `c0f42f67...` is red on current main and its failure log is no longer retained.
  - Before the Phase 1 handshake, choose whether to repair it, bound it away from governance-only changes, or separately decommission it. Do not silently treat it as a required governance check or accept an unexplained red control plane.

## Phase 2 - `docs`

- Hub ownership:
  - From: Hub and Spoke shared docs say production downloads the checked cross-workflow artifact without rebuilding.
  - To: Hub says pull-request CI validates independently and protected-main delivery builds and deploys its own same-run artifact; publish Hub first, then refresh the Spoke reference in a separate change.
  - Rollback: revert Hub truth first if the decision itself is reversed, then separately refresh the Spoke reference. Never edit `client-web/docs/_shared/` directly.
- Workflows:
  - From: `website-check.yml` blob `8dce620a...` runs on pull request and main push; `pages-deploy.yml` blob `596e77de...` consumes its artifact through `workflow_run`.
  - To: `Website contract` remains PR/manual validation; main delivery performs frozen build/verify in a secret-free job and deploys that same-run artifact from a production job after exact-current-main verification.
  - Rollback: revert to both captured workflow blobs. Before enabling protection, prepare a reviewed revert path that can still produce the required `Website contract`.
- Repository settings:
  - From: no main protection/ruleset; all three merge methods enabled.
  - To: classic main protection requires strict `Website contract` from app `15368`, a pull request with zero approvals, administrator enforcement, conversation resolution, linear history, no force push, and no deletion; merge commit disabled; squash/rebase retained.
  - Rollback: restore protection absence only if the protection itself is faulty; restore the captured merge flags. If a broken required check blocks the revert PR, use an explicitly authorized temporary removal of only that required context, merge the revert PR, and immediately restore the protection payload.
- Environment:
  - Keep production custom branch policy `{id:55844964,name:"main",type:"branch"}` unchanged.

## Phase 3 - `client-web`

- Preconditions:
  - From: current main `832429357...` has failed Workspace and peer-database checks; every open pull request is five commits behind current main.
  - To: an eligible latest-base pull request proves all four required contexts green without weakening their contracts.
- Workflows:
  - From: `ci.yml` blob `3b39fc7a...` runs full checks for pull requests and main; `pages-deploy.yml` blob `58a85487...` promotes successful PR/main artifacts to preview/production; cleanup blob `984e0a0b...` is separate.
  - To: PR-only full validation retains all four context names; same-repository PR artifacts feed isolated preview delivery; protected main performs a focused web build and deploys the same release-run artifact; cleanup remains separate.
  - Rollback: revert changed workflow and contract files through a pull request, restoring all three captured blobs and the prior runtime-inventory assertions. Keep the last successful production deployment live until replacement smoke succeeds.
- Repository settings:
  - From: administrator enforcement off; conversation resolution off; linear history on; strict four-check gate; merge/squash/rebase enabled.
  - To: administrator enforcement and conversation resolution on; existing four checks and linear history retained; merge commit disabled; squash/rebase retained.
  - Rollback: restore `enforce_admins=false`, `required_conversation_resolution=false`, existing required-check payload, and captured merge flags.
- Environments:
  - From: preview and production have no protection or branch policy.
  - To: production accepts only `main`; preview remains non-production but its secrets are environment-scoped and same-repository guarded.
  - Rollback: restore the captured null branch policies. Secret relocation rollback requires owner-held values because GitHub does not expose them.
- Deployment recovery inputs:
  - Forward: exact `source_sha`, positive `build_run_id`, fixed artifact name, fixed branch `main`, and fixed environment `production`.
  - Rollback: exact prior release run, expected source SHA, fixed artifact name, reason, and explicit confirmation; validate trusted workflow path, success, provenance, and artifact before redeploy and smoke.

## Phase 4 - `core-py`

- Workflows and docs:
  - From: five tracked workflow blobs listed in `core-py.json`; mutable third-party Action tags; local `CONTRIBUTING.md` blob `f99d7d99...`.
  - To: immutable Action SHAs and an organization-policy link while preserving current CI, preview, GHCR, and Heroku behavior and all context names.
  - Rollback: revert to captured workflow and contribution blobs through a pull request.
- Repository settings:
  - From: administrator enforcement and conversation resolution on; strict four-check PR gate; linear history off; merge/squash/rebase enabled; no-deletion/non-fast-forward ruleset active.
  - To: linear history on and merge commit disabled; every other protection, check, squash/rebase option, and ruleset remains unchanged.
  - Rollback: set `required_linear_history=false`, restore `allow_merge_commit=true`, and retain all captured protections and ruleset `9279710` unchanged.
- Environment and release:
  - Keep production main policy `{id:55411191,name:"main",type:"branch"}` and current source-verified rebuild topology unchanged.

## Phase 5 - `ui`

- Release blocker:
  - From: PR #34 head `279c6111...` has an `action_required` run with zero jobs and lacks `Reproducible workspace check`.
  - To: a successful GitHub Actions check with that exact context and app `15368` is attached to the exact PR head before any rule tightening.
  - Immediate rollback/fallback: retain manual run approval or dispatch against `changeset-release/main`; verify the resulting check SHA rather than trusting the run label.
- Workflow:
  - From: release workflow blob `49c09df9...` has no serialization and uses the built-in token for Changesets mutations and package publication.
  - To: add `ui-release-main` concurrency with `cancel-in-progress:false`; initially retain the manual release-PR check procedure. A dedicated repository-scoped App remains a separately approved optional slice.
  - Rollback: revert to blob `49c09df9...`; retain last published package `@inkcre/ui-web@1.3.0` and release run `30329027636` as evidence, not as an automatic republish instruction.
- Rulesets and merge settings:
  - From: ruleset `11133402` blocks deletion/non-fast-forward on main/develop; ruleset `19865127` strictly requires one check on main; neither requires PR/conversation/linear history. All merge methods are enabled.
  - To: keep both existing protections and check identity; add pull-request requirement with zero approvals, conversation resolution, and linear history on main with no bypass; disable merge commit and retain squash/rebase.
  - Rollback: restore the full captured objects for rulesets `11133402` and `19865127` and the captured merge flags.
- Optional App rollback fields:
  - Workflow old/new blob or revert commit; installation ID; secret names; client ID variable; source SHA; PR number/head SHA. Revoke the installation and delete/rotate repository credentials; keep package authentication on the built-in token.

## Phase 6 - Actions Hardening

- Current per-repository rollback values:
  - `.github`, `core-py`, `client-web`, `docs`: default token `write`, Actions PR approval `true`, allowed Actions `all`, SHA enforcement `false`.
  - `ui`: default token `read`, Actions PR approval `true`, allowed Actions `all`, SHA enforcement `false`.
- Target:
  - Default token `read`; Actions PR approval `false`; explicit job-level writes; immutable Action SHAs enforced after the repository pin audit.
  - Pilot selected Actions with GitHub-owned Actions plus only the pinned external owners used by that repository: pnpm, PDM, Docker, Cloudflare, Neon, Changesets, Peter Evans, and the optional GitHub App token action where applicable.
- Readiness:
  - Ready for SHA enforcement now: `client-web`, `ui`, `docs`.
  - Not ready: `.github`, `core-py`; pin their captured mutable references first.
- Rollback:
  - Restore each repository's captured default permission, approval flag, allowed-actions mode, and SHA-enforcement flag independently. Do not change organization defaults during this rollout.

## Dry Validation Boundary

- All JSON payload components are derived from live GET responses and are locally parseable.
- No restore, protection, environment, credential, or merge-setting write was executed in Phase 0.
- Each later phase must snapshot again immediately before mutation because GitHub state may drift after this capture.
