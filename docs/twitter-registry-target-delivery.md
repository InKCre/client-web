# Twitter Registry Target Delivery

`inkcre/twitter@0.1.0` has one client target defined by
`extensions/twitter/target-publish.json`. Its target key is an immutable Registry
slot; it is not a Pages branch or a browser enablement state.

## Production Flow

1. A `push` to protected `main` runs `Client checks`. Its workspace job runs the
   full contract and uploads the checked `client-web-dist` and atomic
   `twitter-target-dist` directories.
2. `Pages and Twitter Registry delivery` accepts only a successful,
   same-repository `Client checks` push run whose SHA is still `main`.
3. A change to `extensions/twitter/target-publish.json` is the explicit release
   intent. Only that case downloads the checked Twitter artifact, builds its
   canonical manifest, and enters the Registry publication lane. Changing the
   Twitter source tree or shared MF declaration without that release intent is a
   delivery error, not a silent skip.
4. The publication lane captures any existing target provenance, publishes with
   the scoped `INKCRE_EXTENSION_REGISTRY_TOKEN`, then reads the public release,
   canonical manifest, and every declared file back by digest. Any immutable-slot
   conflict fails closed and blocks Pages.
5. A main revision without release intent skips the Twitter lane rather than
   trying to replace the already-published target. After the applicable target
   gate and a second `main` recheck, the controller deploys the checked web
   artifact to Pages.

Pull requests, merge-group runs, manual CI runs, and Pages previews never meet
the controller identity predicate and cannot publish a production Registry
target.

## Frozen Publisher Toolchain

`tooling/extension-publisher/` is a standalone Python 3.12 project. Its
`uv.lock` fixes the v0.1.2 Registry CLI wheel download and SHA-256 together with
its transitive dependencies. Production invokes only:

```bash
uv run --project tooling/extension-publisher --frozen inkcre-ext
```

Do not replace it with `pip install`, `uv tool run`, a floating package range,
or the Registry source checkout. Updating the CLI requires an intentional
release URL, wheel digest, lock refresh, contract test update, and review.

## Provenance And Reruns

The target digest is the SHA-256 of the canonical executable manifest. Its
Registry association stores the first accepted source repository, source
revision, and build ID. A rerun with the same target key and digest is valid,
but the controller verifies that this original target provenance remains
unchanged.

The workspace may rebuild different Twitter bytes when shared Host code changes.
Those incidental candidate bytes are not a new Extension release and must not be
written into an existing immutable target slot. An intentional Twitter code or
compatibility release must update `target-publish.json` together with its
version/contract change; the workflow enforces this source-to-intent pairing and
the strict publication lane then proves or rejects it.

The workflow summary separately records the current checked source revision,
the delivery controller revision, and delivery run ID. Those delivery facts are
not placed in the immutable executable manifest or used to overwrite target
provenance.

## Local Checks

```bash
pnpm exec vitest --project runtime scripts/twitter-target-delivery-contract.test.mjs
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12 .github/workflows/*.yml
uv lock --check --directory tooling/extension-publisher
```

The local artifact verifier can inspect a built remote without credentials. Do
not run production publication locally or copy the Registry token into a file.
