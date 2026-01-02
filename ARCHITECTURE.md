# InKCre Client-Web Architecture

## Table of Contents

1. System Overview
2. Technology Stack
3. High-Level Architecture
4. Architecture Patterns
5. Directory Structure
6. Core Systems
7. Data Flow

---

## System Overview

InKCre Client-Web is a web-based application for information collection, organization, and visualization. It provides a GUI for managing the InKCre system, featuring graph-based storage, extensible plugins, and real-time visualization.

**Core Capabilities:**

- Automated data collection with scheduled jobs
- Knowledge graph with blocks and relations
- Module Federation-based extensions
- Multi-client peer network
- Interactive graph layouts
- Pluggable content handling

**Business Domains:**

- **Source**: Data input pipeline
- **Info-Base**: Graph-based knowledge system
- **Extension**: Plugin architecture
- **Client**: Multi-client management
- **Obsrv**: Observability and logging

---

## Technology Stack

**Core Framework:**

- Vue 3 (Composition API)
- TypeScript (strict typing)
- Vite (build tool)
- SCSS + UnoCSS (styling)

**State & Routing:**

- Pinia (global state)
- Vue Router (navigation)

**Data Layer:**

- Zod (validation and type inference)
- PostgREST client (database access)

**Extension System:**

- Module Federation (dynamic loading)

**Visualization:**

- Vue Flow (graph rendering)
- D3.js (layouts)

**APIs:**

- Hono (server routes)
- JOSE (authentication)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         InKCre Client-Web                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                         Vue App                               │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │                    Views Layer                          │  │  │
│  │  │  (Settings, Sources, Extensions, Info-Base Graph)       │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │                 Components Layer                        │  │  │
│  │  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │  │  │
│  │  │   │  Source  │ │ Info-Base│ │Extension │ │ Client  │  │  │  │
│  │  │   │Components│ │Components│ │Components│ │ Comps   │  │  │  │
│  │  │   └──────────┘ └──────────┘ └──────────┘ └─────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │               Business Logic Layer                      │  │  │
│  │  │   ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │   │           BusinessClass Pattern                  │  │  │  │
│  │  │   │  (Source, Client, Extension, Block, Relation)    │  │  │  │
│  │  │   │  - Zod Schema + TypeScript Class                 │  │  │  │
│  │  │   │  - Static API clients (DBAPIClient, CoreAPIClient)│ │  │  │
│  │  │   │  - Static registries for instances               │  │  │  │
│  │  │   └─────────────────────────────────────────────────┘  │  │  │
│  │  │   ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │   │        Extension System (Module Federation)      │  │  │  │
│  │  │   │  - Dynamic remote loading                        │  │  │  │
│  │  │   │  - Lifecycle management (DISCOVERED → ACTIVE)    │  │  │  │
│  │  │   │  - Registry pattern for Storages/Resolvers       │  │  │  │
│  │  │   └─────────────────────────────────────────────────┘  │  │  │
│  │  │   ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │   │         Info-Base Subsystems                     │  │  │  │
│  │  │   │  - Storage: Content retrieval (http, local, etc) │  │  │  │
│  │  │   │  - Resolver: Content rendering (text, image, etc)│  │  │  │
│  │  │   │  - Graph: Force/Dagre/Circular layouts           │  │  │  │
│  │  │   └─────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      API Layer (Dual)                         │  │
│  │  ┌──────────────────────────┐  ┌────────────────────────┐    │  │
│  │  │     DBAPIClient          │  │   CoreAPIClient        │    │  │
│  │  │  (PostgREST via Supabase)│  │   (REST to core-py)    │    │  │
│  │  │  - Direct DB queries      │  │   - Complex operations │    │  │
│  │  │  - CRUD operations        │  │   - Business logic     │    │  │
│  │  └──────────────────────────┘  └────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  State Management (Pinia)                     │  │
│  │   - Auth Store (JWT tokens, user state)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Config System (zod-config)                        │  │
│  │   - localStorage / HTTP / dev adapters                         │  │
│  │   - Runtime config switching                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────┐
        │          Backend Services                      │
        │  ┌──────────────────┐  ┌──────────────────┐   │
        │  │  PostgreSQL DB   │  │   core-py API    │   │
        │  │  (via PostgREST) │  │   (REST Server)  │   │
        │  └──────────────────┘  └──────────────────┘   │
        └───────────────────────────────────────────────┘
```

### Data Flow Overview

1. User interaction triggers Vue components
2. Components invoke BusinessClass methods
3. BusinessClass uses DBAPIClient or CoreAPIClient
4. API clients communicate with backend
5. Responses update reactive UI

---

## Architecture Patterns

### 1. BusinessClass Pattern

Combines Zod schemas with TypeScript classes for type-safe entities. Provides runtime validation, centralized API access, and instance registries.

**Key Features:**

- Single source of truth for types and validation
- Static API clients per entity
- Consistent CRUD operations

### 2. Dual API Architecture

Two separate API clients for different access patterns:

**DBAPIClient (PostgREST):**

- Direct database queries
- Fast CRUD operations
- Simple list and filter queries

**CoreAPIClient (REST):**

- Complex business logic
- Validation and orchestration
- Batch operations and workflows

**Decision Criteria:**

- Use DBAPIClient for simple, performance-critical operations
- Use CoreAPIClient for complex logic requiring backend processing

### 3. Module Federation Extension System

Dynamic plugin loading with lifecycle management. Extensions register custom storages and resolvers.

**Lifecycle:**
DISCOVERED → LOADING → LOADED → INITIALIZING → READY → ACTIVATING → ACTIVE

**Benefits:**

- Runtime extensibility
- Shared dependencies
- Strong isolation

### 4. Registry Pattern (Storage & Resolver)

Decorator-based registration for pluggable content handling. Extensions can add new content types with custom retrieval and rendering logic.

**Storage:** Handles content fetching (HTTP, local, external APIs)
**Resolver:** Handles content transformation and rendering

### 5. Config Adapter System

Multi-source configuration with runtime switching. Supports localStorage, HTTP, and development adapters with Zod validation.

---

## Directory Structure

```
client-web/
├── docs/                 # Domain documentation
├── extensions/           # Module Federation remotes
│   └── twitter/          # Example extension
├── public/               # Static assets
├── server/               # Cloudflare Workers server
├── src/
│   ├── business/         # Business logic (BusinessClass pattern)
│   │   ├── api.ts        # DBAPIClient + CoreAPIClient
│   │   ├── info-base/    # Graph subsystems
│   │   │   ├── block.ts
│   │   │   ├── relation.ts
│   │   │   ├── storage.ts
│   │   │   └── resolver.ts
│   │   └── source.ts     # Source entity
│   ├── components/       # Vue components by domain
│   │   ├── source/
│   │   ├── info-base/
│   │   ├── extension/
│   │   └── common/
│   ├── composables/      # Vue composition functions
│   ├── views/            # Route views
│   ├── stores/           # Pinia stores
│   ├── locales/          # Internationalization
│   └── config.ts         # Configuration system
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Core Systems

### Business Layer

Implements domain entities using BusinessClass pattern. Each entity has:

- Zod schema for validation
- Static API clients
- Instance registries
- CRUD methods

**Key Entities:**

- **Source**: Data collection configurations
- **Client**: InKCre client instances
- **Extension**: Plugin modules
- **Block**: Information units in graph
- **Relation**: Connections between blocks

### Extension System

Module Federation-based plugins with lifecycle management. Extensions can:

- Register custom resolvers for new content types
- Register custom storages for data retrieval
- Add UI components
- Extend business logic

### Component Architecture

Organized by business domain:

- Domain-specific components for each business area
- Shared common components
- Type-safe props using prop factories

### State Management

Pinia stores for global state:

- Auth store for JWT tokens and user state
- Local reactive state for component-specific data

### Configuration

Multi-adapter system supporting:

- localStorage for persistence
- HTTP for server-side config
- Development environment variables

---

## Data Flow

### Read Flow

User action → View component → BusinessClass.list() → DBAPIClient → PostgREST → Database → Response → Zod validation → Reactive UI update

### Write Flow

User action → Component → BusinessClass instance → CoreAPIClient → core-py API → Validation & business logic → Database write → Response → UI update

### Extension Flow

Extension activation → Register remote → Load module → Initialize (register handlers) → Activate (start tasks) → Features available

### Content Resolution Flow

Block display → Get resolver → Fetch storage content → Resolve content → Cache result → Render via content component

---

**Last Updated**: January 2, 2026
