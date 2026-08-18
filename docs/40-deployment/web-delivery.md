# Web Delivery

## Artifact Contract

`apps/client-web` produces a static, environment-neutral Vite artifact. Runtime service origins,
Peer identity, and JWT credentials remain browser-owned and are not compiled into production or
preview bytes. Pages supplies static hosting only: this repository has no application Worker or
runtime configuration endpoint. [`scripts/verify-client-web-release.mjs`](../../scripts/verify-client-web-release.mjs)
and [`scripts/check-package-contract.mjs`](../../scripts/check-package-contract.mjs) enforce the
artifact boundary.

The **Client checks** workflow in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
validates the candidate but uploads no deployable SPA, Module Federation, or Registry handoff
artifact. Preview and production each build at their own authority boundary and cannot publish
native Extensions.

The browser-side authority behind this invariant belongs to
[Client Runtime and Delegation](../30-unit-tdd/client-runtime-and-delegation.md).

## Production Pages

[`.github/workflows/pages-deploy.yml`](../../.github/workflows/pages-deploy.yml) owns production
delivery. A successful `Client checks` run for a protected-`main` push selects that exact source
SHA, while delivery rejects the run if a newer revision supersedes it. The delivery job consumes
no check artifact: it checks out the exact source, installs the frozen workspace, builds the
release, reverifies `main`, and deploys those same-run bytes to the Cloudflare Pages `main` branch
in the protected `production` environment.

The Pages project is selected by `CLOUDFLARE_PAGES_PROJECT`; deployment uses the protected
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. After upload, the workflow smoke-tests both the
Pages deployment URL and `https://app.inkcre.dev`. Production delivery has no Extension Registry
token and no native Extension publication responsibility.

## Pull-request Preview

[`.github/workflows/pages-preview.yml`](../../.github/workflows/pages-preview.yml) owns previews for
open, same-repository pull requests targeting `main`; fork pull requests are ineligible. The
`pull_request_target` controller checks out its trusted default-branch revision separately from the
exact candidate head, installs the candidate's frozen pnpm and PDM environments, builds its SPA and
selected Module Federation snapshots, and uses `inkcre-ext preview build` with the explicit
`.github/preview/extensions.json` inventory to add a same-origin static Registry facade. Before
deployment it revalidates that the PR is still open and its identity and head SHA have not changed.

The Toolkit places read-only native Extension snapshots and preview Releases beside the exact-head
app build, using the stable alias branch `preview/client-web/pr-<number>`. This is a preview
projection, not Registry publication: the workflow has no
`INKCRE_EXTENSION_REGISTRY_TOKEN`. It registers a transient GitHub `preview` deployment, deploys
through Pages and reports the provider deployment result. It does not turn edge propagation,
deep route traversal, cache behavior, or byte comparison into synchronous delivery gates; consumer
acceptance is a separate black-box activity.

When an eligible internal PR closes, [`.github/workflows/pages-cleanup.yml`](../../.github/workflows/pages-cleanup.yml)
replaces only that exact preview alias with a closed-page tombstone. Manual cleanup accepts an
explicit positive PR number and applies the same closed internal-PR identity checks.
