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
- Config (`core/src/config`) - environment-neutral schema plus runtime-owned browser or extension
  storage
- Peer runtime contract (`core/src/database/runtime-contract.ts`) - generated protocol and JWT
  claim metadata without environment instances

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
- ESM-only tsdown output with declarations and declaration maps

### apps/client-web

- Vue3 SPA with routing
- Graph visualization (Vue Flow)
- UI components by domain
- Static Vite output
- Browser-local bootstrap configuration and JWT signing
- Environment-neutral static artifact; no InKCre environment origin or client identity is compiled
  in
- No application Worker or runtime config endpoint

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
- Build: Vite for applications/remotes, WXT for browser extensions, tsdown for `@inkcre/core`
- Quality: Oxfmt and Oxlint at the repository root
- Types: TypeScript 5.9 required, native TypeScript 7 shadow, Vue TSC, Zod
- State: Pinia
- Styling: SCSS, UnoCSS
- Graphs: Vue Flow, D3, Graphology
- Extensions: Module Federation
- Deploy target: the static Vite artifact on Cloudflare Pages

## Local Development Topology

- Official SVC 10.0.1 resolves the current worktree identity and coordinates the declared `web`
  `webext`, and `database` capabilities.
- Portless maps each capability to an instance-specific HTTPS `.localhost` name while Vite and WXT
  bind their assigned application ports to loopback.
- Both servers expose an identity endpoint. The executable SVC probe discovers the registered
  Portless route, connects through loopback, and accepts only the exact target/instance payload.
- The optional `web-ui` capability consumes a validated sibling `@inkcre/ui-web` package root
  through exact Vite/Vitest aliases. Its source identity participates in the readiness probe;
  normal `web`, build, check, and CI remain registry-backed.
- WXT keeps optional Chromium state under `.runtime/dev/<instance>` and never claims a fixed
  debugging port or shared browser profile.
- The database target uses one tracked Compose/runtime contract with two transports:
  - `local` invokes the host Docker CLI and publishes collision-safe loopback ports;
  - `ssh` sends a bounded Compose payload to one user-configured SSH alias, lets the remote engine
    allocate loopback ports, and exposes them through an instance-owned OpenSSH control tunnel.
- An optional `external` development attachment consumes one absolute, ignored core-py runtime
  descriptor. It proves owner repository, database runtime instance, Compose project, Docker
  daemon, contract revision, migration head, source fingerprint, and live endpoints before reuse.
  Client-web remains a consumer and cannot reset, stop, or delete the core-py-owned volume/tunnel.
- Provider selection and all SSH machine facts live in ignored `svc.local.json`; the committed
  default remains portable local Docker.
- Local/E2E launchers inject their isolated runtime into browser-owned state. The production and
  preview artifacts remain byte-for-byte independent of any PostgREST/core-py instance.
- PostgreSQL/PostgREST schema, migration, roles, seed, and reset semantics remain a
  `core-py`-owned capability boundary.
- Stopping a worktree removes only its Portless routes and client-owned database resources. An
  external core-py runtime remains owned and reachable until core-py stops it.
