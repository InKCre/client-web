# Phase 0 Evidence Freeze

- Captured at: `2026-08-07T09:13:32Z`
- Authority: live GitHub REST API and GitHub Actions check/run APIs, queried with GET requests only.
- Scope: `InKCre/.github`, `core-py`, `client-web`, `ui`, and `docs`; organization fields are limited to plan and Actions constraints relevant to this task.
- Format: normalized snapshots retain exact settings, identities, workflow blob SHAs, blockers, and rollback inputs without copying unrelated account data or secret values.
- Integrity: `SHA256SUMS` covers every JSON snapshot and `transitions.md`.

## Phase 0 Findings

- GitHub Free blocks organization rulesets. Enforcement must remain repository-level.
- `.github/main` is unprotected. Its only tracked workflow is red on current main, has no readable retained failure log, and uses mutable Action tags.
- `core-py/main` already requires a pull request, four strict GitHub Actions checks, administrator enforcement, and conversation resolution. It lacks linear-history enforcement and still allows merge commits; tracked workflows use mutable third-party Action tags.
- `client-web/main` requires four strict checks and linear history, but administrators can bypass and conversations need not be resolved. Current main is a direct-pushed red SHA; all open Dependabot pull requests are behind current main.
- `ui/main` has no classic protection. Repository rulesets prevent deletion/non-fast-forward updates and require one strict check, but do not require a pull request or conversation resolution. Release pull request #34 lacks the required check because its run is `action_required` with zero jobs.
- `docs/main` has no protection or ruleset. Its current main CI and production deployment are green, and its production environment custom branch policy is exactly `main`.
- `client-web`, `ui`, and `docs` tracked third-party Actions are already SHA-pinned. `.github` and `core-py` are not ready for SHA-pinning enforcement.

## Preconditions

- Phase 1 must decide how the stale `.github` Pages workflow should behave when governance files change; it cannot assume an existing green control-plane check.
- Phase 2 must update the `InKCre/docs` Hub statement that currently describes cross-workflow artifact reuse before refreshing any Spoke shared reference.
- Phase 3 must restore `client-web` required checks through their owning dependency/runtime work. Do not weaken checks for governance rollout.
- Phase 5 must attach a successful `Reproducible workspace check` to the exact head of `ui` release pull request #34 before tightening rules.
- Credential relocation has no automatic rollback because GitHub never returns secret values. Each credential-bearing phase needs a separate owner-confirmed backup/re-entry procedure.

## Files

- `organization.json` - GitHub plan and organization Actions constraints.
- `dotgithub.json` - governance control-plane baseline.
- `core-py.json` - service repository baseline.
- `client-web.json` - application repository baseline and current red state.
- `ui.json` - package repository baseline and release-PR blocker.
- `docs.json` - documentation-site baseline.
- `transitions.md` - exact later `From -> To` changes and rollback payloads.
