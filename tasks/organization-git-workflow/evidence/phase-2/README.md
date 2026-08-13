# Phase 2 Documentation-Site Pilot Evidence

## Published Contract

- `InKCre/docs` pull request #10 passed `Website contract` and was squash-merged on 2026-08-07.
- Accepted Hub commit: `cdab38b62700da686e58ac5a7e0c13ed8c1e472d`.
- The contract separates pull-request validation and isolated preview evidence from canonical
  protected-main release authority.
- Cloudflare documentation was rechecked during implementation: the latest deployment for a preview
  branch cannot be deleted; close-time retirement therefore uses a trusted `noindex` tombstone and
  leaves older immutable deployments in Cloudflare history.

## Spoke Reference

- `client-web/docs/_shared` advances from `95c4023` to accepted Hub commit `cdab38b` in draft pull
  request #39 at commit `66f7fd9d66846b23a79a9be931c7ed15b63310b2`.
- Canonical shared-doc `pre-bump` and `pre-commit` checks passed.
- The commit contains only the `docs/_shared` gitlink.
- The pull request remains draft because existing `client-web` baseline failures are unrelated to
  the gitlink: three high dependency advisories and the pinned core image's multiple migration heads.
  No required check is weakened for this reference update.

## Documentation-Site Implementation

Branch: `InKCre/docs` branch `agent/docs-preview-main-delivery`.

- Workflow commit: `f6ded282d3c0f87b2efcd414e6d535062849736a`.
- Simplification commit: `2c32104f3881d9108bd2115ea423283ae3abe85e`, removing the
  hand-maintained route/output verifier in favor of the native VitePress build contract.
- Pull request #11 was squash-merged as `45986b8a4b05034bb8c6c7bf8ca2fef2a7282a87`.
- Exact-head `Website contract`: passed in run `31177810021`.

The published implementation:

- makes `Website checks` pull-request/manual-only while preserving `Website contract` and its checked
  artifact;
- adds a trusted `workflow_run` preview controller for exact open same-repository pull-request heads;
- uses deterministic branch `preview/docs/pr-N`, per-PR concurrency, preview-only smoke, and no fork
  credentials;
- replaces closed previews with a trusted `noindex` tombstone on that exact branch;
- changes production to `push: main`, with GitHub rerun handling a failed release commit;
- rebuilds and verifies the selected main source in a secret-free job, then deploys the same-run
  artifact without rebuilding;
- records source SHA, run ID, artifact digest, Cloudflare deployment identity, and smoke result;
- keeps preview and production credentials out of pull-request source execution.

## Local Verification

- `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/*.yml`
- `pnpm --dir website check`
- `git diff --check`
- `node --check` for all changed/new website scripts
- the VitePress build completes without a second hand-maintained route/output manifest;
- invalid smoke mode fails closed;
- static assertions confirm the production lane contains no `workflow_run`/cross-run artifact ID and
  `Website checks` contains no Cloudflare or deployment capability.

## Live Runtime Evidence

- Main release run `31178083697` rebuilt `45986b8`, transferred the same-run artifact, deployed it
  to Cloudflare Pages, and passed immutable plus canonical smoke.
- Disposable same-repository pull request #12 passed `Website contract` in run `31178251277` and
  preview run `31178287868`; `https://preview-docs-pr-12.inkcre-website.pages.dev` returned HTTP 200
  with `X-Robots-Tag: noindex`.
- Closing #12 exposed one minimal runtime bug: cleanup run `31178381666` failed because the job did
  not set up repository Node 22.22.3 before `wrangler-action`, so npm rejected runner Node 22.23.1.
- Fix pull request #14 added the pinned Node setup, a bounded manual cleanup input, stable preview
  alias reporting, and an explicit GitHub Deployment bound to the exact pull-request head. It was
  squash-merged as `4c44cf16a95bc0e049c4345c1de5512ec68b53a6`.
- Main release run `31182229474` rebuilt and published that merge successfully. Automatic cleanup
  run `31182230692` replaced #14's stable preview with the noindex tombstone.
- Manual cleanup run `31182331416` retired closed pull request #12 without reopening it; its stable
  preview URL now returns the noindex tombstone. Cloudflare's older immutable deployments remain as
  accepted implementation history.
- Open pull request #13's current-head preview run `31182604884` created GitHub deployment
  `5795332146` at exact head `f0851bd98b92fe91f283ae0ea0da5642293edb15`. Its successful status
  exposes `https://preview-docs-pr-13.inkcre-website.pages.dev`, and the GitHub pull-request page now
  renders the corresponding `View deployment` link.
- Stale-head preview run `31182488776` was correctly rejected after Dependabot restacked #13 onto
  the newer main revision.

## Live Settings Outcome

- `docs/main` is protected through classic branch protection. It requires a pull request, strict
  `Website contract` from GitHub Actions app `15368`, resolved review conversations, linear history,
  and administrator enforcement; required approving reviews remain zero for the initial rollout.
- Force pushes and deletion are disabled. Repository merge commits are disabled while squash and
  rebase remain available; automatic branch deletion remains disabled.
- Open pull request #13 remains green and mergeable under the new rules with its exact-head
  `Website contract`, proving the normal path was not locked out.
- GitHub now has the `preview` environment created by the first successful preview controller run;
  the existing `production` custom deployment branch policy remains `main`.
- Preview and production reuse the existing repository-selected organization secrets
  `CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_API_TOKEN`. Separate credentials are an optional later
  hardening step, not a Phase 2 prerequisite.
- Actions repository defaults and approval/SHA-enforcement settings remain Phase 6 work.

## Runtime and Protection Proof

1. Pull request #11 has proven `Website contract` on its exact head. The preview controller cannot
   run for the PR that first introduces it because `workflow_run` uses the default-branch controller.
2. Pull request #11 and main release run `31178083697` proved the exact-main build, same-run artifact
   transfer, Cloudflare production deploy, and canonical plus immutable smoke.
3. Pull requests #12/#14 proved exact-head preview and close retirement; pull request #13 proved the
   stable alias is attached to the exact pull-request head in GitHub. Same-repository identity also
   rejected a stale head. Fork runs remain ineligible for the preview job by the controller condition.
4. Classic main protection and repository merge settings now match the approved baseline. The
   Phase 0 absence and prior merge flags remain the rollback input.
