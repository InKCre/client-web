# Architecture Overview

## System Layers

```
┌─────────────────────────────────────────────────────┐
│                    Applications                      │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │  client-web      │  │  client-webext          │  │
│  │  (Vue3 + Vite)   │  │  (WXT browser ext)      │  │
│  └──────────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                   @inkcre/core                       │
│  Models, APIs, Storage, Resolvers, Extensions       │
├─────────────────────────────────────────────────────┤
│                    Extensions                        │
│  Module Federation remotes (e.g., twitter)          │
├─────────────────────────────────────────────────────┤
│                    Backend                           │
│  PostgreSQL (PostgREST) + core-py API               │
└─────────────────────────────────────────────────────┘
```

## Core Patterns

- BusinessClass (`core/src/`) - Zod schema + TS class + static API
- Dual API (`core/src/base`, `core/src/client`) - DBAPIClient (PostgREST) + CoreAPIClient (REST)
- Module Federation (`core/src/extension`) - Dynamic plugin loading
- Registry (`core/src/info-base/`) - Pluggable Storage & Resolver
- Config Adapters (`core/src/config`) - Multi-source configuration

## Data Flow

1. Read: Component → BusinessClass.list() → DBAPIClient → PostgREST → DB
2. Write: Component → BusinessClass → CoreAPIClient → core-py → DB
3. Extension: Activate → Load remote → Register handlers → Features ready
4. Content: Block → Resolver → Storage.fetch() → Render

## Package Responsibilities

### @inkcre/core
- Domain models (Block, Relation, Source, Client, Extension)
- API clients (DBAPIClient, CoreAPIClient)
- Extension lifecycle & Module Federation
- Storage & Resolver abstractions
- Configuration management
- Authentication store

### apps/client-web
- Vue3 SPA with routing
- Graph visualization (Vue Flow)
- UI components by domain
- Cloudflare Workers deployment

### apps/client-webext
- Browser extension (Chrome/Firefox)
- Content scripts & sidepanels
- AI-powered features (explain, notes)
- WXT framework

### extensions/*
- Module Federation remotes
- Custom resolvers & storages
- Extend business logic

## Tech Stack

- Framework: Vue 3 (Composition API)
- Build: Vite, tsup
- Types: TypeScript, Zod
- State: Pinia
- Styling: SCSS, UnoCSS
- Graphs: Vue Flow, D3, Graphology
- Extensions: Module Federation
- Deploy: Cloudflare Workers
