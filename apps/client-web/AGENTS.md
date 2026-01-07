# Client-Web AGENTS.md

Web client for InKCre - provides GUI for system management and visualization.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vue3 + TypeScript |
| Styling | SCSS + UnoCSS |
| UI Library | `@inkcre/web-design` |
| Routing | vue-router |
| State | pinia |
| i18n | vue-i18n |
| Graphs | Vue Flow, D3, dagre |
| Deploy | Cloudflare Workers |

## Business Domains

| Domain | Purpose |
|--------|---------|
| source | Data collectors (input) |
| info-base | Graph: block, relation, storage, resolver |
| sink | Output/visualization |
| extension | Plugin system |
| client | Multi-client management |
| obsrv | Observability/logging |

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

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm type-check       # TypeScript check
pnpm deploy:cf        # Deploy to Cloudflare
```

## Coding Guidelines

- Search codebase before creating new types
- [Write code for humans](/.agents/prompts/code-for-human.md)

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Development workflow
- [src/components/AGENTS.md](./src/components/AGENTS.md) - Component guide
