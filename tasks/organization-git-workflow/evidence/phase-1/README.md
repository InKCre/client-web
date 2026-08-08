# Phase 1 Evidence

## Published state

- Repository: `InKCre/.github`
- Base SHA: `b85c74cad2270f37d241f0182040c9d760e7d5a6`
- Published main SHA: `911e4515916b6c399b856cc89e62631695a5cbf8`
- Commit: `docs(governance): establish organization workflow baseline`
- Publication path: direct administrator push to `main`, explicitly authorized
- Role: non-active GitHub-native governance/community carrier; outside the
  active-repository branch-policy baseline

## Final remote tree

- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
- `GOVERNANCE.md`
- `LICENSE`
- `README.md`
- `profile/README.md`

The commit added the organization governance, contribution entrypoint, default
pull-request template, and profile links. It removed the superseded VitePress
source, Node package and lock files, Pages workflow, site configuration, editor
configuration, and site TODOs: 245 insertions and 3,111 deletions across 54
files.

## Remote cleanup

- `DELETE /repos/InKCre/.github/pages`: success; subsequent GET returns 404
- `DELETE /repos/InKCre/.github/environments/github-pages`: success; subsequent
  GET returns 404; the environment had zero secrets and zero variables
- `PATCH /orgs/InKCre {blog: "https://inkcre.dev"}`: success
- `GET /repos/InKCre/.github/actions/workflows`: `total_count=0`
- `https://inkcre.dev/`: HTTP 200 after the organization metadata change

Git history was not rewritten. The retired content remains recoverable from the
pre-change commit and repository history.

## Community-file verification

Live `GET /repos/InKCre/{repo}/community/profile` results after publication:

- `client-web`: organization `CONTRIBUTING.md`; local pull-request template
- `core-py`: local `CONTRIBUTING.md`; organization pull-request template
- `ui`: organization `CONTRIBUTING.md` and pull-request template
- `docs`: organization `CONTRIBUTING.md` and pull-request template

This confirms GitHub's default-file inheritance and the two intentional local
overrides. Profile-specific alignment remains in the later repository phases.

## Validation

- pre-publish remote `main` matched the Phase 0 SHA
- focused Markdown lint: success
- `git diff --check`: success
- staged scope review: 54 intended files only
- post-push local `HEAD`, `origin/main`, and remote main SHA: identical
- final remote tree: only the six GitHub-native files above
- no active Actions workflow, Pages site, or Pages environment remains

## Rollback

- Revert `911e451` on `.github/main` to restore tracked files.
- Restore the Phase 0 Pages configuration only if the retired site must return.
- Restore the organization `blog` value to
  `https://docs.inkcre-thing.hadream.ltd` only as part of that recovery.
