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
- The package version is the exact Extension Release version and must change when Remote source or
  shared-module input changes.
- `vite.config.ts` retains `base: './'` and `manifest: true`.
- `pnpm check` builds the Remote and validates its native manifest, Remote entry, and referenced
  shared/exposed JS/CSS closure.
- Protected-main CI retains the checked snapshot. Delivery uploads those exact files as one ZIP to
  the Registry native Module Federation endpoint; local development never publishes.

See [`apps/client-web/docs/development.md`](../apps/client-web/docs/development.md) for the full
joint-development boundary.
