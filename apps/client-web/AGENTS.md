# Client-Web AGENTS.md

Web client for InKCre - GUI for system management and visualization.

## Tech Stack

- Framework: Vue3 + TypeScript
- Styling: SCSS + UnoCSS
- UI Library: `@inkcre/web-design`
- Routing: vue-router
- State: pinia
- i18n: vue-i18n
- Graphs: Vue Flow, D3, dagre
- Deploy: Cloudflare Workers

## Business Domains

- source - Data collectors (input)
- info-base - Graph: block, relation, storage, resolver
- sink - Output/visualization
- extension - Plugin system
- client - Multi-client management
- obsrv - Observability/logging

## Directory Structure

```
server/                  # Cloudflare Workers
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

## Coding Guidelines

- Search codebase before creating new types
- [Write code for humans](/.agents/prompts/code-for-human.md)

## Related Docs

- [Development Guideline](./docs/development.md)
- [Component AGENTS.md](./src/components/AGENTS.md)
