# First-party Extension Delivery

This document owns the operational Release and Registry delivery contract for first-party client-web
Extensions. Extension lifecycle and Host internals belong to
[Native Extension Runtime](../30-unit-tdd/native-extension-runtime.md). A producer is an
`extensions/*/package.json` declaring `inkcre.module_federation`; its package version is the
exact Registry Release version, and its `inkcre` metadata owns the canonical Extension identity and
compatible `@inkcre/core` Host SDK range.

## Release Intent and Versioning

Contributors record intent with `pnpm changeset`, selecting only affected independently releasable
Extension packages. On a protected `main` push,
[`.github/workflows/extension-release.yml`](../../.github/workflows/extension-release.yml) runs the
**First-party Extension release** lifecycle:

- With pending changesets, Changesets Action runs `pnpm release:version` and creates or updates the
  Extension Version PR. That PR owns generated package versions and changelogs; contributors do not
  edit those outputs separately. The reconciliation step does not publish, create GitHub Releases,
  or push tags.
- After the Version PR is merged and no changesets remain, the candidate job checks out that exact
  release revision, installs the frozen workspace, and builds `@inkcre/core` plus every
  `extensions/*` producer itself. It saves the selected plan, original prepare descriptors, full ZIP
  snapshots and SHA-256 digests as the immutable `first-party-extension-candidate` Actions artifact.
  No Registry writes occur until that artifact is retained and checked.
- Producers are discovered from package metadata. A published Release with an existing Module
  Federation association is a historical no-op at candidate selection. Missing associations become
  fixed candidates; the publish job downloads this run's exact artifact, prepares them with their
  saved provenance, uploads, publishes, and verifies every candidate from the public Registry.
  It never consumes pull-request CI artifacts or rebuilds a publication candidate.

The repository must enable **Allow GitHub Actions to create and approve pull requests** for
Changesets to create its Version PR. GitHub combines these capabilities in one setting; this
workflow only creates PRs and must never approve reviews. Default workflow-token permissions stay
read-only, with write permissions confined to reconciliation. GitHub may require a maintainer to
select **Approve workflows to run** on a token-created Version PR before its checks execute; do not
replace this gate with an empty-check merge or a broader credential.

Client checks, Pages production, and Pages preview are separate application lifecycles. They cannot
publish first-party Extensions. Local development and local verification must never publish either.

Python and Module Federation producers for one Extension must target the same exact Release when
both Hosts are needed. A published Python-only Release may receive its missing Module Federation
association through the normal publish workflow; existing associations are not overwritten. Select
the Changesets increment that reaches that Release rather than downgrading the shared installation
or manually editing generated package versions.

## Registry Authority and Secret Boundary

Publication runs only in the protected GitHub `production` environment. The scoped bearer secret
`INKCRE_EXTENSION_REGISTRY_TOKEN` belongs only to the first-party Extension publish job; it must not be
copied to a file, exposed to Pages or checks, or used for protected delivery from a developer
machine. The public Registry defaults to `https://registry.inkcre.dev`; operators may override only
the endpoint through repository variable `INKCRE_EXTENSION_REGISTRY_URL`.

The workflow records `source_repository`, `source_revision`, and a release-workflow `build_id` in
the Module Federation distribution before upload. These Web-distribution provenance facts remain
independent of any Python distribution attached to the same Registry Release.

Hosted documentation is discovered separately for the exact Release. Browser code follows the
absolute entry or snapshot URL returned by Registry and never derives a content hostname from the
Registry origin, Extension identity, or snapshot ID. The first-party deployment currently uses a
broad `*.inkcre.dev` DNS/TLS catch-all while Registry admits only
`registry-docs-{snapshot}.inkcre.dev`; therefore DNS resolution or a successful TLS handshake is
not documentation availability. A 421 response is a rejected Host, not a URL pattern for the Web
client to repair or retry under another subdomain.

## Failure and Recovery

An upload timeout is an unknown outcome, not proof of a rejected snapshot: a Registry behind Heroku
may finish after its router returns H12. The publisher makes a bounded attempt to complete the
existing publish operation and read back the Release. A new MF-only Release remains publicly
invisible while preparing, so recovery cannot rely on public GET alone. Authentication failures,
immutable conflicts, blocked/yanked Releases and byte mismatches fail rather than becoming retries
or successful skips.

After a transient publication failure, use **Re-run failed jobs** or re-run only
**Publish first-party MF distributions**. These partial reruns retain the successful candidate
job's artifact and output, so publication downloads the same exact artifact ID. Do not use
**Re-run all jobs**: GitHub removes the original artifacts before executing the new attempt.
Candidate discovery rejects a missing artifact on any attempt after the first, before build or
Registry writes. An existing candidate is restored and checked, never silently replaced.
Both first publication and recovery verify the full public
snapshot, including candidates whose association appeared after an earlier timeout. A later,
unrelated main push may classify those historical Releases as no-ops; it does not claim to verify
them against a new build.

Candidates are retained for 90 days. Do not delete the artifact of an unfinished release or start
a new run to replace its prepared provenance. An expired or lost candidate requires operator
investigation using the original run and Registry state; a fresh build is not equivalent evidence.
The same conservative stop applies if the first attempt failed before saving any candidate. After
confirming that publication never ran, the operator may proceed through a new normal main run.
If publication did run, recover the original candidate; do not use a new build or new run to replace
its bytes or prepared provenance.
The original ZIP digest and all-file verification count are written to the publish job summary.

`node --test scripts/test-extension-publication.mjs` exercises the publisher over an isolated HTTP
fault-injection endpoint: an MF-only upload returns 503 while the saved snapshot becomes available,
publish initially reports incomplete objects, and recovery verifies the original ZIP even after
local build output changes. It also proves that an existing selected association cannot bypass
byte verification, immutable conflicts stop immediately, and invalid saved candidates cause no
Registry writes. It also checks that a rerun without its saved candidate stops before rebuilding.
This is a publisher regression check, not evidence of production R2 latency.

## Snapshot and Verification

Each producer retains the relative artifact base `base: './'`, emits
`dist/client-web/mf-manifest.json`, and declares its Registry association in package metadata. The
distribution verifier checks the manifest Remote entry and every synchronous or asynchronous
shared/exposed JavaScript and CSS reference, then compares every file in the uploaded snapshot,
including transitive chunks and generated metadata. The uploaded snapshot is self-contained and
relocatable; publication does not invent a generic target descriptor or rewrite the producer
manifest.

Public executable responses use `Cache-Control: public, no-cache` and an ETag. Immutable Release
bytes do not imply an immutable HTTP cache policy: browsers must revalidate Registry readability
so a blocked Release stops being served. Verification also checks CORS, the trusted Registry origin,
manifest structure, and the exact bytes of every referenced asset.

The executable contract is
[`scripts/verify-native-extension-distribution.mjs`](../../scripts/verify-native-extension-distribution.mjs).
Verify locally without publishing:

```bash
pnpm --filter @inkcre/core build
pnpm --filter './extensions/*' build
node scripts/verify-native-extension-distribution.mjs inspect-local \
  --package extensions/<extension>/package.json \
  --core-package packages/core/package.json \
  --artifact-directory extensions/<extension>/dist/client-web
```
