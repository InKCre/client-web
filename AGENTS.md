# AGENTS.md - InKCre Web Monorepo

## Overview

InKCre is an information management system for automatic collection, organization, and use of information. This monorepo contains all web clients and shared packages.

## Monorepo Structure

| Path | Description |
|------|-------------|
| `packages/core` | Shared logic: models, APIs, extensions, storage, resolvers |
| `packages/ext-dev-utils` | Extension development utilities |
| `apps/client-web` | Main web client (Vue3 + Vite) |
| `apps/client-webext` | Browser extension (WXT) |
| `extensions/<id>` | Module Federation extension remotes |

## Quick Reference

- **Package Manager**: pnpm
- **Node**: ^20.19.0 or >=22.12.0
- **Dev**: `pnpm dev` (client-web), `pnpm dev:all` (with extensions)
- **Build**: `pnpm build`

## Key Documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture overview |
| [FILESYSTEM.md](./FILESYSTEM.md) | Directory structure guide |
| [.agents/prompts/code-for-human.md](./.agents/prompts/code-for-human.md) | Human-readable code guidelines |
| [apps/client-web/AGENTS.md](./apps/client-web/AGENTS.md) | Client-web specific guide |
| [extensions/AGENTS.md](./extensions/AGENTS.md) | Extension development guide |

## Business Domains

- **source**: Data collectors (input)
- **info-base**: Graph-based knowledge (block, relation, storage, resolver)
- **sink**: Output/visualization
- **extension**: Plugin system (Module Federation)
- **client**: Multi-client management
- **obsrv**: Observability/logging

## Coding Guidelines

- Search before creating new types/utilities
- [Write code for humans](./.agents/prompts/code-for-human.md)
