# Client-Web AGENTS.md

Web client for InKCre - GUI for system management and visualization.

## Tech Stack

- Framework: Vue3 + TypeScript
- Styling: SCSS + UnoCSS
- UI Library: `@inkcre/ui-web`
- Routing: vue-router
- State: pinia
- i18n: vue-i18n
- Graphs: Vue Flow, D3, dagre
- Runtime: static Vite SPA
- Deploy target: Cloudflare Pages

## Business Domains

- source - Data collectors (input)
- info-base - Graph: block, relation, storage, resolver
- sink - Output/visualization
- extension - Plugin system
- peer - Technical Peer management; keep product-facing UI language as “client”
- obsrv - Observability/logging

## Directory Structure

```
src/
├── components/<domain>/ # Vue components by domain
├── composables/         # Composition functions
├── locales/             # i18n
├── views/<domain>/      # Route views
├── storages/            # App storage
├── styles/              # Global SCSS
├── utils/               # Utilities
├── core.ts              # Core initialization
├── router.ts            # Routes
└── main.ts              # Entry
```

## Runtime Contract

- The application has no Hono/Worker runtime and no `/api/config` endpoint.
- Bootstrap config is validated and persisted in this origin's localStorage.
- A fresh origin has no environment default. Static output and source maps contain no InKCre
  environment origin or Peer identity.
- `https://registry.inkcre.dev` is the reviewed public product Registry fallback, not a deployment
  environment coordinate. A Peer owner or deployment config may override it at operation time.
- The user-supplied JWT signing credential is masked, never logged, and excluded from portable
  config exports.
- Start through the root `pnpm dev` command so SVC and Portless preserve worktree identity.
- Use root `pnpm dev:ui --ui-source <package-root>` only for the opt-in sibling UI source loop.

## Coding Guidelines

- Search codebase before creating new types
- [Write code for humans](/.agents/prompts/code-for-human.md)

## Related Docs

- [Development Guideline](./docs/development.md)
- [Component AGENTS.md](./src/components/AGENTS.md)
