# Development Guide of InKCre Web Extensions

InKCre Web Extensions are native Module Federation Remotes. Their default exposed module uses the
Web lifecycle defined by `@inkcre/core`.

## Local Development

Use `pnpm dev:all` for joint Host/Remote development. The extension playground remains useful for
isolated lifecycle and UI work.

When a Remote and `@inkcre/ui-web` change together, start the consumer-owned source lane:

```bash
pnpm dev:all:ui --ui-source ../ui/packages/web
```

The Twitter Vite config reuses the Host's source aliases, peer dedupe, filesystem allowance, and
UI-owned Sass prelude. Normal build, check, and CI paths consume the locked UI package.

## Native Distribution

- `package.json` declares canonical Extension Name/Nickname and the `@inkcre/core` Host range.
- Add a release-intent fragment with `pnpm changeset` when a user-visible change affects an
  independently releasable Extension.
- The automated Changesets Version PR aggregates fragments and updates only affected Extension
  package versions and changelogs. Do not edit either generated output separately.
- `vite.config.ts` retains `base: './'` and `manifest: true`.
- `pnpm check` builds the Remote and validates its native manifest, Remote entry, and referenced
  shared/exposed JS/CSS closure.
- With pending changesets, the independent Extension Release workflow creates or updates the
  Version PR. Once it is merged, the workflow's idempotent custom publisher uploads the exact
  snapshot built by that release workflow to the Registry native Module Federation endpoint. It
  discovers every package declaring `inkcre.module_federation`; Pages delivery separately consumes
  only the app artifact, and local development never publishes.

See [`apps/client-web/docs/development.md`](../apps/client-web/docs/development.md) for the full
joint-development boundary.
