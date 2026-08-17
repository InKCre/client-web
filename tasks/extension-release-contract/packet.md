# Client-Web Extension Release Lifecycle

## MVT Core

- **Objective**: use Changesets as the version/changelog and release-plan owner for independently
  releasable client-web Extensions, then publish native Extension artifacts through a lifecycle
  independent from client-web app deployment.
- **Status**: **Complete**。The official Changesets control flow、Version PR and independent
  exact-main Registry publication have passed end-to-end production acceptance.
- **Authority**: pending changeset files own release intent; the Changesets release plan owns
  aggregated SemVer decisions; each Extension `package.json` owns its prepared version; generated
  Extension changelogs own release history; the InKCre Registry owns publication state.
- **Next step**: none for this unit。Using an independent GitHub App token or fine-grained PAT so a
  bot-authored Version PR triggers PR Actions automatically is explicitly deferred by the Human；the
  current fallback is a real Human reopen event before merge and does not reopen this unit.

## Product and Tool Model

A changeset is an unconsumed intent to change one or more package versions and changelogs. Multiple
changesets may accumulate safely. They are inputs to one release plan, not proofs attached to every
source diff.

The Changesets Action has two relevant modes:

```text
pending changesets on checked main
  -> calculate release plan
  -> create or update one Version PR

no pending changesets on checked main
  -> no Version PR work remains
  -> allow the idempotent custom Extension publisher to converge Registry state
```

The setup does not use `changeset publish`, npm publication, Git tags, or GitHub Releases. The
repository uses the action's `has-changesets` output to route the second mode into its own Registry
publisher.

## Delivery Topology

```text
main
├── Client checks
├── Pages delivery -> consumes the app delivery artifact selected by its own controller
└── Native Extension release
    ├── pending changesets -> Changesets Version PR
    └── no changesets
        -> checkout release revision
        -> build every native Extension in the release workflow
        -> idempotent Registry publication
```

- Pages delivery requires and consumes only `client-web-dist`; it cannot read Registry publication
  credentials or publish native Extensions.
- Native Extension release produces its own artifacts from the release revision. It never consumes
  artifacts made by Client checks or another workflow, and it does not deploy the app.
- The Registry publisher queries the prepared package version. An already published native
  association is a no-op; a missing association is prepared, uploaded, published, and anonymously
  read back from the exact checked artifact.
- Mail and Twitter both declare native distribution metadata and participate in the same Changesets
  Version PR and Registry publisher.

## Implementation Boundary

### In scope

- `@changesets/cli` 3 and private-package versioning for Extension workspace packages.
- Pending patch changesets for Twitter's stored-media correction and Mail's newly explicit native
  distribution contract.
- A SHA-pinned Changesets Action v2 workflow with its exact v2 input names.
- Independent Pages and native Extension delivery controllers.
- Existing exact-artifact Registry preparation, upload, publication, and public readback.
- Local Extension contributor and delivery guidance.

### Out of scope

- A repository-owned release-plan state machine or shadow Changesets implementation.
- A CI rule requiring a changeset for every source diff.
- Correlating individual source diffs with individual changeset fragments.
- npm publication, `changeset publish`, Git tags, or GitHub Releases.
- Shared Hub product documentation; these are client-web repository mechanics.

## Acceptance

1. A main revision with pending Mail/Twitter changesets causes the Extension workflow to
   create or update one Version PR and does not invoke Registry publication.
2. That Version PR consumes both fragments, changes Mail `0.1.0 -> 0.1.1` and Twitter
   `0.1.1 -> 0.1.2`, generates both changelogs, and leaves non-Extension versions unchanged.
3. After the Version PR merges, the Extension workflow sees no pending changesets, checks out the
   release revision, builds both native artifacts itself, and publishes both exact Registry
   Releases.
4. Re-running publication for an already associated version is an explicit no-op.
5. Pages delivery consumes only `client-web-dist`, retains its existing exact-main checks, and has
   no Extension Registry credential or publication behavior.
6. Frozen install, actionlint, focused workflow assertions, the root check, and anonymous Registry
   readback succeed.

## Failure Record and Correction

- The initial Changie spike used a same-commit versioning model that did not fit client-web's desired
  JavaScript release workflow.
- The first Changesets implementation was also rejected. It treated a changeset as proof attached
  to one source diff, invented `pending / prepared / unchanged` release states, and embedded native
  Extension publication in Pages delivery.
- That implementation additionally used Changesets Action v1-style inputs against v2. The exact v2
  contract uses `github-token`, `version-script`, `commit-message`, and `pr-title`; `GITHUB_TOKEN` as
  an environment variable does not configure the v2 action.
- Root cause: tool selection was investigated, but the tool's end-to-end control flow and exact
  versioned API were not used as the design authority before introducing repository-owned policy.
- Correction: remove the shadow release contract, follow Changesets' pending-plan/Version-PR model,
  and isolate Extension CD from app CD.

## Decision Log

- 2026-08-17: core-py keeps Changie; client-web uses Changesets.
- 2026-08-17: the Human enabled GitHub Actions pull-request creation and accepted a bot-owned
  Version PR with manual CI handling if required.
- 2026-08-17: Changesets preflight verified private Extension package versioning and independent
  Twitter/Mail release plans.
- 2026-08-17: the Human identified that an unconsumed changeset is already release intent and that
  Extension CD does not belong in client-web app CD.
- 2026-08-17: the unit was rewritten around the official Changesets Action v2 lifecycle; the custom
  release-contract script and comparison-aware CI gate were removed.
- 2026-08-17: the Human identified that organization release workflows must produce their own
  release artifacts rather than consume CI outputs. Cross-workflow Extension artifact download was
  removed; Mail received the same native metadata and relocatable artifact contract as Twitter.
- 2026-08-17: the real local release-plan projection produced only Mail `0.1.1` and Twitter `0.1.2`
  with independent changelogs; both self-built artifacts passed the shared native manifest and
  Registry-association verifier.
- 2026-08-17: PR #72 established the lifecycle，PR #73 restored private-package read permission for
  the release reconciler，and Version PR #74 consumed both pending fragments。Main run `32017311088`
  self-built both artifacts and published `inkcre/mail@0.1.1` and `inkcre/twitter@0.1.2`；both exact
  public Release APIs and Module Federation manifests returned HTTP 200。
