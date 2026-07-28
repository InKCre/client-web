# Development Guide of InKCre Web extensions

InKCre Web loads extension through Module Federation, extension is the MF Remote.

InKCre provides a playground for extension, which mocks all points Host (apps, eg. client-web, client-webext) will use of the extension.

For most of case, pass the playground test is enough.
But in some situation, a joint debugging is required. At this point, you can give a list of extension you want to joint debug in `.env`, and host will start the dev servers and use Vite to proxy them. At this mode, you can still add breakpoints in extension's code and so debug it.

When a remote and `@inkcre/ui-web` are being changed together, start the
consumer-owned source lane from the repository root:

```bash
pnpm dev:all:ui --ui-source ../ui/packages/web
```

The Twitter Vite config reuses the host's exact source aliases, peer dedupe,
filesystem allowance, and UI-owned Sass prelude. The normal `pnpm dev:all`,
build, check, and CI paths continue to use the locked registry package. See
[`apps/client-web/docs/development.md`](../apps/client-web/docs/development.md#joint-dev-with-inkcreui-web)
for the full lifecycle and release-fidelity boundary.
