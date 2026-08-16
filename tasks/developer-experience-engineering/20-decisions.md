# Candidate Decisions

These are proposed decisions, not implementation authorization.

## D1 - Static Hosting and Hono

- Status: accepted; implemented locally in Step 4.
- Recommendation:
  - treat client-web as a static SPA;
  - remove the Hono/Worker wrapper and `httpAdapter` unless a real runtime server responsibility is admitted;
  - deploy the static artifact to Cloudflare Pages.
- Rationale:
  - Hono currently adds only runtime config indirection and redundant asset fallback;
  - browser-local configuration removes the need for `/api/config`;
  - Pages directly supplies production and per-PR static deployments.
- Revisit trigger: a server-only binding, authenticated BFF, dynamic response, or other durable runtime responsibility is intentionally added.

## D2 - Client Configuration and JWT Credential

- Status: accepted; implemented for web and webext in Step 4.
- Recommendation:
  - web owns one browser-local config authority, preferably localStorage;
  - webext owns its equivalent through extension storage;
  - persist and restore the selected authority, or hard-cut adapter selection entirely if only one remains;
  - permit the user to provide their own PostgREST JWT secret;
  - never configure that user credential as a shared Cloudflare Pages, Worker, or `VITE_*` secret.
- Credential handling requirements:
  - mask it in UI;
  - never log it;
  - make config export explicitly sensitive or exclude the credential by default;
  - keep generated JWTs memory-only;
  - document that browser-local storage trusts the origin, installed extensions, and local browser profile.
- Rejected default: server-issued tokens or a Worker BFF. Those change the current local-first authority model and require separate product intent.

## D3 - Toolchain

- Status: accepted and implemented locally in Phase 2.
- Recommendation:
  - Oxfmt is the single formatter;
  - Oxlint is the primary linter;
  - a second linter survives only for a named Vue template rule Oxlint cannot cover;
  - tsdown replaces tsup only for real library output, initially `@inkcre/core`;
  - Vite remains the web/remote builder and WXT remains the browser-extension builder;
  - one ecosystem-supported stable TypeScript plus `vue-tsc` remains required;
  - TypeScript 7 native runs only as a non-blocking shadow check.
- Revisit trigger: measured missing coverage or a production-ready TS7/Vue toolchain.

## D4 - Local PostgREST Ownership

- Status: accepted and implemented through the published core-py runtime contract.
- Recommendation:
  - `core-py` remains the only schema and migration authority;
  - client-web gets a pinned Docker PostgREST capability backed by that authority;
  - client-web owns only Compose orchestration, provider transport, worktree isolation, readiness,
    and bounded cleanup;
  - commit portable local Docker as the default and keep SSH target/executable facts in ignored
    `svc.local.json`;
  - do not copy SQL migrations into client-web.
- Revisit trigger: schema authority deliberately moves to another unit.

## D5 - SVC and Shared Product Docs

- Status: accepted and implemented.
- Recommendation:
  - adopt official SVC `10.0.1` in client-web and the Hub;
  - query the packaged SVC corpus rather than copying v9 framework docs;
  - keep `InKCre/docs` as the authoritative PRD/Product TDD Hub;
  - mount it read-only under client-web only after Hub v10/main is settled;
  - mechanically verify shared-reference freshness.

## D6 - Branch and Release Policy

- Status: proposed.
- Recommendation:
  - establish checks and preview deployment on the current integration history first;
  - verify and fast-forward `main` from `develop`;
  - protect `main` and use it as the sole integration and production branch;
  - retire the long-lived branch split.
- Revisit trigger: a documented release-train requirement justifies a distinct integration branch.

## D7 - Environment-Neutral Browser Artifacts

- Status: accepted; implementation authorized in Phase 6.
- Recommendation:
  - compile no environment-specific service origin, client identity, or fallback endpoint into web
    or extension artifacts, including source maps;
  - keep browser-local configuration empty until the user or an explicit local/E2E bootstrap
    supplies it;
  - consume only environment-neutral protocol and JWT-claim facts from the core-py contract;
  - remove production/legacy profile snapshots from client-web instead of maintaining a second
    environment authority.
- Rationale:
  - a static artifact should be promotable unchanged across preview and production;
  - service origins and client identities are public rather than secret, but compiling them still
    couples release identity to one environment and makes accidental production access possible;
  - core-py owns environment instances while client-web owns only the environment-neutral client
    contract.
- Rejected alternative: classify origins and client IDs as harmless public defaults and allow them
  in the bundle.

## D8 - Reactive Configuration and Effect Ownership

- Status: design constraints accepted; implementation remains unstarted and requires a separate
  explicit start.
- Recommendation:
  - expose one top-level configuration result: `ready` with validated immutable config, or
    `invalid` with structured validation issues;
  - represent missing, empty, malformed, and unsupported values as issue kinds inside `invalid`,
    not as competing lifecycle states;
  - publish desired state through Vue reactivity;
  - let each effectful subsystem subscribe independently and own its complete lifecycle:
    start/update/stop, latest-only cancellation, idempotence, error reporting, and disposal;
  - keep extension startup overlap prevention inside the extension runtime rather than in the app
    layer.
- Rationale:
  - `incomplete` has no distinct control-flow meaning once every non-ready state must suspend
    dependent behavior and direct the user to configuration;
  - a central app coordinator accumulates cross-subsystem ordering and cancellation knowledge and
    becomes fragile as subscribers grow;
  - observer topology removes central orchestration, while local ownership preserves enforceable
    concurrency semantics.
- Constraint: subscription does not itself solve races. Every subscriber must define what happens
  when desired state changes during an in-flight effect.
- Rejected alternative: app-layer sequencing of database, authentication, extension, and routing
  side effects.

## D9 - Dependabot Convergence

- Status: accepted; local implementation authorized in Phase 6.
- Recommendation:
  - consolidate the five currently open GitHub Actions updates into one reviewed immutable-SHA
    change;
  - group future GitHub Actions updates and allow only one version-update PR at a time;
  - group npm production and development minor/patch updates, but keep major updates isolated;
  - delay npm version updates for 30 days after a major release, 7 days after a minor release, and
    3 days after a patch release;
  - allow at most three open npm version-update PRs;
  - authenticate Dependabot to `@inkcre` GitHub Packages through a dedicated
    `INKCRE_PACKAGES_READ_TOKEN` Dependabot secret with only package-read authority;
  - remove Wrangler's GitHub token integration so the workflow's protected GitHub environment is
    the single deployment-record authority.
- Rationale:
  - the current five PRs are independently green but behind main and do not verify the current
    delivery controller;
  - a consolidated update reduces queue noise and gives Pages production/preview one coherent
    validation target;
  - grouping unrelated major upgrades destroys failure isolation, while explicit cooldowns keep
    newly published versions behind pnpm's supply-chain age gate;
  - copying the operator's broadly scoped GitHub CLI token into Dependabot would violate
    least-privilege.
- Manual prerequisite: Sir creates the dedicated Dependabot secret; repository configuration may
  reference it only when the failure mode is explicit and reviewable.

## D10 - Client Database Compatibility Versus Image Provenance

- Status: accepted; implemented locally after core `stable` advanced without a database interface
  change. Remote image-backed CI remains the final verifier.
- Recommendation:
  - generate checked Supabase relation types from the selected core image's raw schema;
  - generate `runtime-contract.generated.json` as the compact client compatibility projection:
    format, contract revision, protocol format/schema, and complete JWT claim contract;
  - retain the selected immutable image, schema digest, and source revision in CI summary,
    artifacts, and the E2E runtime state, not in checked client source;
  - validate the image-owned raw runtime contract against its manifest before projecting it.
- Rationale:
  - a source revision identifies one delivered image, whereas the checked client contract identifies
    the interface the browser actually consumes;
  - combining them makes a core deployment-only change block unrelated client PRs and creates
    cross-repository synchronization churn;
  - the selected image still undergoes exact real-service validation, so removing provenance from
    the checked projection does not weaken release traceability.
- Rejected alternative: automatically commit a consumer synchronization after every core delivery.
  It preserves the mistaken authority boundary and introduces cross-repository timing churn.
