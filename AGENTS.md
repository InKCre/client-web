# AGENTS.md - InKCre Web Monorepo

Information management system for automatic collection, organization, and use of information.

## Monorepo Structure

- `packages/core` - Shared logic: models, APIs, extensions, storage, resolvers
- `packages/ext-dev-utils` - Extension development utilities
- `apps/client-web` - Main web client (Vue3 + Vite)
- `apps/client-webext` - Browser extension (WXT)
- `extensions/<id>` - Module Federation remotes

## Quick Reference

- **Package Manager**: pnpm
- **Node**: ^20.19.0 or >=22.12.0
- **Dev**: `pnpm dev` / `pnpm dev:all`
- **Build**: `pnpm build`

## Key Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [FILESYSTEM.md](./FILESYSTEM.md) - Directory structure
- [.agents/prompts/code-for-human.md](./.agents/prompts/code-for-human.md) - Code guidelines
- [apps/client-web/AGENTS.md](./apps/client-web/AGENTS.md) - Client-web guide
- [extensions/AGENTS.md](./extensions/AGENTS.md) - Extension guide

## Business Domains

- **source** - Data collectors (input)
- **info-base** - Graph: block, relation, storage, resolver
- **sink** - Output/visualization
- **extension** - Plugin system (Module Federation)
- **client** - Multi-client management
- **obsrv** - Observability/logging

## Coding Guidelines

- Search before creating new types/utilities
- [Write code for humans](./.agents/prompts/code-for-human.md)
