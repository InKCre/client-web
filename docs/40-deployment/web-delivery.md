# Web Delivery

## Artifact Contract

`apps/client-web` produces a static, environment-neutral Vite artifact. Runtime service origins,
Peer identity, and JWT credentials remain browser-owned and are not compiled into production or
preview bytes. Pages supplies static hosting only: this repository has no application Worker or
runtime configuration endpoint. [`scripts/verify-client-web-release.mjs`](../../scripts/verify-client-web-release.mjs)
and [`scripts/check-package-contract.mjs`](../../scripts/check-package-contract.mjs) enforce the
artifact boundary.

The **Client checks** workflow in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) builds
and uploads the exact `client-web-dist` artifact. Pages workflows consume checked artifacts; they do
not rebuild application bytes and cannot publish native Extensions.

The browser-side authority behind this invariant belongs to
[Client Runtime and Delegation](../30-unit-tdd/client-runtime-and-delegation.md).

## Production Pages

[`.github/workflows/pages-deploy.yml`](../../.github/workflows/pages-deploy.yml) owns production
delivery. It accepts only a successful same-repository `Client checks` push run for `main`, requires
the checked `client-web-dist`, and rejects the selection if a newer `main` revision supersedes it.
The delivery job checks out the exact controller revision, downloads that exact artifact, reverifies
`main`, and deploys it to the Cloudflare Pages `main` branch in the protected `production`
environment.

The Pages project is selected by `CLOUDFLARE_PAGES_PROJECT`; deployment uses the protected
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. After upload, the workflow smoke-tests both the
Pages deployment URL and `https://app.inkcre.dev`. Production delivery has no Extension Registry
token and no native Extension publication responsibility.

## Pull-request Preview

[`.github/workflows/pages-preview.yml`](../../.github/workflows/pages-preview.yml) owns previews for
open, same-repository pull requests targeting `main`; fork pull requests are ineligible. It requires
the trusted `Workspace contract` job and live `client-web-dist`, `twitter-mf-dist`, and
`twitter-mf-preview-release` artifacts from the exact PR head run. Before deployment it revalidates
that the PR is still open and its identity and head SHA have not changed.

The preview assembler places a read-only native Extension snapshot and preview Release beside the
unchanged app artifact, using the stable alias branch `preview/client-web/pr-<number>`. This is a
preview projection, not Registry publication: the workflow has no
`INKCRE_EXTENSION_REGISTRY_TOKEN`. It registers a transient GitHub `preview` deployment, deploys
through Pages, smoke-tests the stable alias, and reports success or failure.

When an eligible internal PR closes, [`.github/workflows/pages-cleanup.yml`](../../.github/workflows/pages-cleanup.yml)
replaces only that exact preview alias with a closed-page tombstone. Manual cleanup accepts an
explicit positive PR number and applies the same closed internal-PR identity checks.
