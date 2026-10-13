# First-party Extension Delivery

This document owns Web native build delivery. Host runtime contracts belong to
[Native Extension Runtime](../30-unit-tdd/native-extension-runtime.md). Each `extensions/*/package.json`
with `inkcre.module_federation` owns its canonical identity, nickname and compatible `@inkcre/core`
range. Its committed package version is development metadata; the Core release plan generates the
exact shared Release version in an isolated build checkout.

## One Release Decision

Core's first-party Extension release workflow owns version selection, fixed Core and Web source
revisions, candidate retention and Registry publication. A native Web change requires a release
fragment for the corresponding Extension in core-py. Select the Web source revision containing that
change when assembling the Release. App and SDK packages continue using Changesets and the package
Version PR; native producers are excluded from that version decision.

The Core workflow invokes the Web consumer after checking out its fixed source revision:

```bash
node scripts/build-native-extension-candidates.mjs consume-plan \
  --plan /absolute/path/to/plan.json --output /absolute/path/to/candidate
```

The plan contains `web_revision`, `build_id` and `candidates` selected by Core. Each candidate includes
`directory`, canonical `name`, `version` and the Python `prepare` association. The consumer matches
producer metadata by canonical name, generates all matching package versions, builds `@inkcre/core`
and the selected MF producers, and checks the resulting snapshots. A candidate with no Web producer
remains Python-only. A matching producer that cannot build or validate fails the whole assembly.

The output `plan.json` retains Core's fields and adds `prepare.module_federation` and
`module_federation: {file, sha256}` to matching candidates. ZIP paths are relative to the retained
candidate directory. Provenance records the fixed Web SHA and Core workflow build ID. Existing
candidate bytes cannot be overwritten by another capture.

Core adds checked wheels, retains the complete candidate before any Registry write, prepares all
associations once, uploads both formats and publishes once. Recovery restores that exact retained
candidate rather than rebuilding it. Registry credentials belong only to the protected Core publish
job. Web CI, Pages production, Pages preview and this local consumer never publish Extensions.

## Snapshot Verification

Producers retain `base: './'` and emit `dist/client-web/mf-manifest.json`. The existing
[`distribution verifier`](../../scripts/verify-native-extension-distribution.mjs) checks the Remote
entry, shared/exposed JavaScript and CSS references, Host SDK range and all snapshot files. Public
verification compares every uploaded file, including transitive chunks and generated metadata,
checks CORS, and confirms that Registry changes only the manifest's public path.

Public executable responses use `Cache-Control: public, no-cache` and an ETag so browsers revalidate
Registry readability when a Release is blocked. Hosted documentation is discovered independently
for the exact Release; browser clients follow the returned absolute URL and never invent a hostname.

`node --test scripts/test-native-extension-candidates.mjs` checks shared version generation, candidate
capture, Python-only preservation, saved-candidate protection and provenance over an isolated fixture.
This does not establish full Client Web enablement; that requires a real published preview Release
and browser acceptance against the preview Registry.
