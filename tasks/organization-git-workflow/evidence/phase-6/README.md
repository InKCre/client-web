# Phase 6 Evidence

Phase 6 closes repository-level Actions drift and performs the final governance audit. It does not
change product code or repository-specific CI/CD topology.

## Pre-mutation snapshot

- Captured: 2026-08-09 through read-only GitHub REST requests against `InKCre/core-py`,
  `InKCre/client-web`, `InKCre/ui`, and `InKCre/docs`.
- Every checked-in external `uses:` reference is a full commit SHA with a readable version comment.
  Local composite actions use local paths.
- Every checked-in workflow declares its token permissions; write grants are limited to the jobs
  that publish packages, create release pull requests, or deploy artifacts.
- All repositories currently allow all Actions and report platform SHA enforcement disabled.
- `core-py`: default token `write`; Actions PR approval enabled; fork approval `first_time_contributors`.
- `client-web`: default token `read`; Actions PR approval disabled; fork approval
  `all_external_contributors`.
- `ui`: default token `read`; Actions PR approval enabled; fork approval `first_time_contributors`.
- `docs`: default token `write`; Actions PR approval enabled; fork approval
  `first_time_contributors`.
- Main protection and merge methods already match the baseline in all four repositories.
- Production is restricted to `main` in `core-py`, `ui`, and `docs`. The `client-web` production
  environment has no deployment branch policy.

## Approved target

- Default token permission is `read` in all four repositories.
- Actions cannot approve pull-request reviews in any repository.
- Every external fork contributor requires maintainer approval before read-only, secret-free CI.
- Platform SHA enforcement is enabled in all four repositories.
- `client-web` production accepts only `main`.
- Selected-actions allowlists remain optional and are not required for Phase 6 completion.

## Applied settings and verification

- All four repositories now report default token permission `read`, Actions PR approval disabled,
  fork approval `all_external_contributors`, `allowed_actions=all`, and platform SHA enforcement
  enabled.
- `client-web` production now has exactly one custom branch policy: branch `main`.
- Secret-free manual validation completed successfully on the exact current main revisions:
  - `docs` `Website checks` run `31300335436` at `4c44cf16`;
  - `ui` `UI checks` run `31300376700` at `f78df4c`;
  - `core-py` `Repository and artifact checks` run `31300460833` at `531b0d28`;
  - `client-web` `Client checks` run `31300570405` at `37546a51`.
- The final remote scan found no unpinned external action reference: `core-py` has 13 external and
  five local references; `client-web` has 46 external references; `ui` has 31; `docs` has 26.
- Required checks remain strict and bound to GitHub Actions app `15368`; main protection or the UI
  rulesets retain required pull requests, zero approvals, resolved conversations, linear history,
  no bypass, no force push, and no deletion.
- Merge commits remain disabled while squash and rebase remain available. Every production
  environment now accepts only `main`.
- The organization contribution files still resolve with the intended local overrides: core-py owns
  its implementation-specific contribution guide, client-web owns its application-specific pull-
  request template, and the organization defaults cover missing files.

## Remaining publication

- The local `InKCre/.github/GOVERNANCE.md` change states the all-external fork approval rule and the
  actual environment-job credential boundary. It requires explicit commit and push authorization.
- The task packet and this evidence remain local until explicitly authorized for commit and push.

## Rollback

- Restore each repository's captured default token, PR approval, fork approval, Actions allow, and
  SHA-enforcement values independently.
- Remove only the newly created `client-web` production branch policy if that policy blocks the
  documented main deployment controller.
- Stop the rollout before mutating the next repository when a secret-free validation workflow cannot
  start. Do not weaken branch protection or expose preview/production credentials to recover CI.
