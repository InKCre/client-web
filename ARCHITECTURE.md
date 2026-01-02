# InKCre Client-Web Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Architecture Patterns](#architecture-patterns)
5. [Directory Structure](#directory-structure)
6. [Core Systems](#core-systems)
7. [Data Flow](#data-flow)
8. [Build & Deployment](#build--deployment)
9. [Extension Development](#extension-development)
10. [Key Design Decisions](#key-design-decisions)
11. [Getting Started](#getting-started)
12. [References](#references)

---

## System Overview

**InKCre Client-Web** is a web-based information management application that provides automatic information collection, organization, and powerful information utilization capabilities. It serves as the primary GUI for managing the InKCre system and provides data visualization, processing, and extension capabilities.

### Core Capabilities

- **Information Collection**: Configurable data sources with scheduled collection jobs
- **Graph-Based Storage**: Information blocks connected by typed relations forming a knowledge graph
- **Extensibility**: Plugin system using Module Federation for extending functionality
- **Multi-Client Architecture**: Peer-to-peer client network with distributed capabilities
- **Real-Time Visualization**: Interactive graph visualization with multiple layout algorithms
- **Content Adaptation**: Pluggable storage and resolver systems for different content types

### Business Domains

- **Source**: Data collectors - the input pipeline to the info-base
- **Info-Base**: Graph-based knowledge system with blocks, relations, storages, and resolvers
- **Extension**: Module Federation-based plugin system for extending capabilities
- **Client**: Multi-client management and communication
- **Obsrv**: Observability with structured logging

---

## Technology Stack

### Core Framework

- **Vue 3.5+** - Composition API with `<script setup>`, reactivity system
- **TypeScript 5.8** - Strict type checking, enhanced type inference
- **Vite 7** - Build tool with HMR and ES module support
- **SCSS** - Styling with CSS modules and preprocessor support
- **UnoCSS** - Atomic CSS engine for utility-first styling

### State Management & Routing

- **Pinia 3** - Vue store with composition API support
- **Vue Router 4.5** - Client-side routing with type-safe navigation
- **VueUse 14** - Collection of Vue composition utilities

### Data Layer

- **Zod 4** - Schema validation and type inference
- **zod-class 0.0.18** - Class-based Zod schemas with decorators
- **zod-config 1.4** - Multi-adapter configuration system
- **@supabase/postgrest-js 2.84** - PostgREST client for database access

### Extension System

- **@module-federation/runtime 0.21** - Dynamic module loading for extensions
- **@module-federation/vite 1.1** - Vite plugin for Module Federation

### Graph & Visualization

- **@vue-flow/core 1.48** - Interactive graph visualization
- **graphology 0.26** - Graph data structure library
- **d3-force 3** - Force-directed graph layout
- **dagre 0.8** - Directed acyclic graph layout

### API & Communication

- **Hono 4.10** - Server-side routing for Cloudflare Workers
- **jose 6.1** - JWT authentication and token management

### Development Tools

- **vue-tsc 3** - Vue TypeScript compiler
- **Biome 2.3** - Fast linter and formatter
- **Wrangler 4.49** - Cloudflare Workers CLI

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

1. **User Interaction** → Vue Components
2. **Components** → BusinessClass instances (e.g., `Source`, `Block`, `Extension`)
3. **BusinessClass** → API Clients (`DBAPIClient` or `CoreAPIClient`)
4. **API Clients** → Backend (PostgREST or core-py REST API)
5. **Backend** → Database / External Services
6. **Response** → BusinessClass validation via Zod → Reactive UI update

---

## Architecture Patterns

### 1. BusinessClass Pattern

A unified pattern combining Zod schemas with TypeScript classes for type-safe data models with built-in validation and API integration.

**Structure:**

```typescript
import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "./api";

export class BusinessEntity extends Z.class({
  id: z.number(),
  name: z.string(),
  config: z.looseObject({}).default({}),
}) {
  // Static API clients
  static dbApi: DBAPIClient = new DBAPIClient("table_name", BusinessEntity);
  static coreApi: CoreAPIClient = new CoreAPIClient("/endpoint", BusinessEntity);
  
  // Static registry for instances
  private static _instances: Map<number, BusinessEntity> = new Map();
  
  // Static CRUD methods
  static async get(id: number): Promise<BusinessEntity> {
    const data = await this.dbApi.from().select().eq("id", id).single();
    return new BusinessEntity(data.data!);
  }
  
  static async list(): Promise<BusinessEntity[]> {
    const results = await this.dbApi.from().select();
    return results.data!.map(item => new BusinessEntity(item));
  }
  
  // Instance methods
  async save(): Promise<void> {
    // Update logic
  }
  
  async delete(): Promise<void> {
    // Delete logic
  }
}
```

**Benefits:**

- Runtime validation via Zod
- Type inference from schema (no duplicate type definitions)
- Centralized API logic per entity
- Static registries for caching and lifecycle management
- Consistent patterns across all business entities

**Examples:**

- [Source](src/business/source.ts) - Data collection sources
- [Client](src/business/client.ts) - Client instances
- [Extension](src/business/extension.ts) - Extension modules
- [Block](src/business/info-base/block.ts) - Information blocks
- [Relation](src/business/info-base/relation.ts) - Block relations

### 2. Dual API Architecture

Separate API clients for different use cases:

**DBAPIClient (PostgREST):**

```typescript
class DBAPIClient {
  // Direct database queries via PostgREST
  from(): PostgrestQueryBuilder {
    return this.client.from(this.tableName);
  }
}
```

- **Use case**: Simple CRUD operations, list queries, filters
- **Benefits**: Fast, direct database access; RESTful query building
- **Examples**: Fetching sources, clients, extensions list

**CoreAPIClient (REST):**

```typescript
class CoreAPIClient {
  async request<T>(options: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, any>;
  }): Promise<T> {
    // REST API request to core-py
  }
}
```

- **Use case**: Complex business logic, validation, orchestration
- **Benefits**: Encapsulates backend logic; handles complex workflows
- **Examples**: Running collection jobs, graph analysis, batch operations

### 3. Module Federation Extension System

Dynamic plugin loading using Webpack Module Federation with custom lifecycle management.

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│             Host App (client-web)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  Extension Class (Business Logic)             │  │
│  │  - Lifecycle states (DISCOVERED → ACTIVE)     │  │
│  │  - Module loading via loadRemote()            │  │
│  │  - IExtension interface contract              │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Module Federation Runtime                     │  │
│  │  - registerRemotes()                           │  │
│  │  - loadRemote(moduleName)                      │  │
│  │  - Custom plugins (lifecycle, error handling) │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     │
                     │ HTTP fetch
                     ▼
┌─────────────────────────────────────────────────────┐
│          Extension Registry Server                   │
│  Serves remoteEntry.js for each extension           │
└─────────────────────────────────────────────────────┘
```

**Extension Lifecycle:**

```
DISCOVERED → LOADING → LOADED → INITIALIZING → READY → ACTIVATING → ACTIVE
                                                                       ↓
                                    UNLOADED ← UNLOADING ← DEACTIVATING
                                          ↓
                                        ERROR
```

**Example Extension:**

```typescript
// extensions/twitter/src/Extension.ts
import type { IExtension } from '@/business/extension';

export default class TwitterExtension implements IExtension {
  async initialize(): Promise<void> {
    // Register custom resolvers, storages
  }
  
  async activate(): Promise<void> {
    // Start background tasks
  }
  
  async deactivate(): Promise<void> {
    // Stop background tasks
  }
  
  async dispose(): Promise<void> {
    // Cleanup resources
  }
}
```

### 4. Registry Pattern (Storage & Resolver)

Pluggable content handling with decorator-based registration.

**Storage System:**

```typescript
@Storage.registry('http-image')
export class HttpImageStorage extends Storage<Uint8Array> {
  async _getRawContent(block: Block): Promise<Uint8Array> {
    const response = await fetch(block.content as string);
    return new Uint8Array(await response.arrayBuffer());
  }
}

// Usage
const storage = await Storage.fromId(storageId);
const content = await storage.getRawContent(block);
```

**Resolver System:**

```typescript
@Resolver.registry('tweet')
export class TweetResolver extends Resolver<TweetRawContent, TweetSolvedContent> {
  readonly type = 'tweet';
  readonly contentComp = TweetContentComponent;
  
  async _resolveSolvedContent(rawContent: TweetRawContent): Promise<TweetSolvedContent> {
    // Parse and enhance tweet data
    return { ...rawContent, enhanced: true };
  }
}

// Usage in component
const resolver = await Resolver.fromBlock(block);
const content = await resolver.getSolvedContent();
```

**Benefits:**

- Extensions can register custom storage/resolver types
- Type-safe content handling with generics
- Lazy loading of content
- Unified error handling and loading states
- Component isolation (contentComp receives resolved content)

### 5. Config Adapter System

Multi-source configuration with runtime switching using `zod-config`.

```typescript
const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.url().default(""),
  INKCRE_PGREST_URL: z.url().default(""),
  INKCRE_EXTENSION_REGISTRY_URL: z.url().default(""),
  INKCRE_JWT_SECRET: z.string().default(""),
  INKCRE_CLIENT_ID: z.uuid().default(""),
});

// Adapters
const localStorageAdapter: ConfigAdapterWithWrite = { /* ... */ };
const httpAdapter: ConfigAdapterWithWrite = { /* ... */ };
const devAdapter: ConfigAdapterWithWrite = { /* ... */ };

// Runtime loading
export const CONFIG = ref<Config>(await loadConfig());

// Save config
await setConfig({ INKCRE_CORE_URL: "https://api.example.com" });
```

**Adapters:**

- **localStorage**: Persistent browser storage
- **http**: Fetch from `/api/config` endpoint
- **dev**: Development mode with env variables

**Use Cases:**

- Development: Use `.env` files
- Production: Fetch from server
- Demo mode: localStorage override

---

## Directory Structure

```
client-web/
├── docs/                      # Domain-specific documentation
│   ├── resolver.md            # Resolver system docs
│   ├── tokens.md              # Authentication tokens
│   └── todo.md                # Task tracking
│
├── extensions/                # Module Federation remotes
│   ├── AGENTS.md              # Extension guidelines
│   └── twitter/               # Example extension
│       ├── src/
│       │   ├── Extension.ts   # Extension entry point
│       │   ├── resolver.ts    # Custom resolver
│       │   ├── schema.ts      # Zod schemas
│       │   └── components/    # Extension components
│       └── vite.config.ts     # MF configuration
│
├── public/                    # Static assets
│
├── server/                    # Cloudflare Workers server
│   └── index.ts               # Hono server routes
│
├── src/
│   ├── business/              # Business logic layer (BusinessClass pattern)
│   │   ├── base.ts            # Base utilities (zinstance)
│   │   ├── api.ts             # DBAPIClient + CoreAPIClient
│   │   ├── client.ts          # Client entity
│   │   ├── extension.ts       # Extension entity + lifecycle
│   │   ├── source.ts          # Source entity
│   │   ├── obsrv.ts           # Observability (logging)
│   │   │
│   │   ├── info-base/         # Info-base subsystems
│   │   │   ├── block.ts       # Block entity
│   │   │   ├── relation.ts    # Relation entity
│   │   │   ├── storage.ts     # Storage system + registry
│   │   │   ├── resolver.ts    # Resolver system + registry
│   │   │   │
│   │   │   ├── storages/      # Built-in storage implementations
│   │   │   │   ├── HttpImageStorage.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── resolvers/     # Built-in resolver implementations
│   │   │   │   ├── TextResolver.ts
│   │   │   │   ├── ImageResolver.ts
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── graph/         # Graph algorithms
│   │   │       ├── community.ts      # Community detection
│   │   │       ├── topology.ts       # Topology detection
│   │   │       └── ...
│   │   │
│   │   └── mf-plugins/        # Module Federation infrastructure
│   │       └── index.ts       # MF runtime plugins
│   │
│   ├── components/            # Vue components (organized by domain)
│   │   ├── source/            # Source domain components
│   │   ├── info-base/         # Info-base domain components
│   │   ├── extension/         # Extension domain components
│   │   ├── client/            # Client domain components
│   │   ├── obsrv/             # Observability components
│   │   └── common/            # Shared components
│   │
│   ├── composables/           # Vue composition functions
│   │   ├── use-async-state.ts
│   │   ├── use-either.ts
│   │   ├── useLayoutManager.ts
│   │   └── layouts/           # Layout algorithms
│   │       ├── useForceLayout.ts
│   │       ├── useDagreLayout.ts
│   │       └── ...
│   │
│   ├── views/                 # Route views (page components)
│   │   ├── start/             # Landing page
│   │   ├── sources/           # Source management
│   │   ├── extensions/        # Extension management
│   │   ├── info-base/graph/   # Graph visualization
│   │   └── settings/          # App settings
│   │
│   ├── stores/                # Pinia stores
│   │   ├── index.ts           # Store setup
│   │   └── auth.ts            # Auth store (JWT tokens)
│   │
│   ├── locales/               # Internationalization
│   │   ├── index.ts
│   │   └── messages/
│   │       ├── en.json
│   │       └── zh-CN.json
│   │
│   ├── styles/                # Global styles
│   │   ├── index.scss
│   │   └── _mixins.scss
│   │
│   ├── utils/                 # Utility functions
│   │   ├── base.ts
│   │   └── vue-props.ts       # Prop factories
│   │
│   ├── App.vue                # Root component
│   ├── main.ts                # App entry point
│   ├── router.ts              # Route definitions
│   └── config.ts              # Config system
│
├── AGENTS.md                  # AI agent guidelines
├── ARCHITECTURE.md            # This file
├── README.md                  # Project overview
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── uno.config.ts              # UnoCSS config
└── wrangler.jsonc             # Cloudflare Workers config
```

---

## Core Systems

### Business Module Layer

The business layer implements domain entities using the BusinessClass pattern.

**Key Characteristics:**

- Zod schema validation with runtime type checking
- Static API clients (DBAPIClient, CoreAPIClient)
- Static instance registries for caching
- Consistent CRUD methods across entities
- Type inference from schemas (single source of truth)

**Core Business Classes:**

#### Source

Data collection sources with scheduled jobs.

```typescript
class Source extends Z.class({
  id: z.number(),
  type: z.string(),
  nickname: z.string(),
  config: z.looseObject({}).default({}),
  collect_at: zinstance<CollectAt>(CollectAt).nullable(),
}) {
  static dbApi: DBAPIClient;
  static coreApi: CoreAPIClient;
  
  async run(): Promise<SourceCollectJob> { /* ... */ }
  static async get(id: SourceRef): Promise<Source> { /* ... */ }
}
```

#### Client

Represents an InKCre client instance (local or remote).

```typescript
class Client extends Z.class({
  id: z.uuid().default(() => crypto.randomUUID()),
  name: z.string(),
  rest_api_url: z.url().nullable(),
}) {
  static dbApi: DBAPIClient;
  
  async ping(): Promise<'online' | 'offline'> { /* ... */ }
  async request<T>(options: {...}): Promise<T> { /* ... */ }
}
```

#### Extension

Module Federation-based plugins with lifecycle management.

```typescript
class Extension extends Z.class({
  id: z.string(),
  version: z.string(),
  enabled: z.array(z.string()).default([]),
  config: z.looseObject({}).default({}),
}) {
  static dbApi: DBAPIClient;
  private static _instances: Map<ExtensionRef, Extension>;
  
  async load(): Promise<void> { /* Module Federation */ }
  async initialize(): Promise<void> { /* Call IExtension.initialize */ }
  async activate(): Promise<void> { /* Call IExtension.activate */ }
}
```

#### Block (Info-Base)

Information units in the knowledge graph.

```typescript
class Block extends Z.class({
  id: z.uuid(),
  resolver: z.string(),
  storage: z.number(),
  content: z.unknown(),
}) {
  static dbApi: DBAPIClient;
  
  async getResolver(): Promise<Resolver> { /* ... */ }
  async getRelations(): Promise<Relation[]> { /* ... */ }
}
```

#### Relation (Info-Base)

Typed connections between blocks.

```typescript
class Relation extends Z.class({
  source_block_id: z.uuid(),
  target_block_id: z.uuid(),
  type: z.string(),
}) {
  static dbApi: DBAPIClient;
  
  async getSourceBlock(): Promise<Block> { /* ... */ }
  async getTargetBlock(): Promise<Block> { /* ... */ }
}
```

### Extension System

Module Federation-based plugin architecture for dynamic capability extension.

**Components:**

1. **Extension Class** - Business logic, lifecycle management
2. **Module Federation Runtime** - Dynamic module loading
3. **IExtension Interface** - Contract for extension modules
4. **Registry Plugins** - Storage/Resolver registration

**Lifecycle Flow:**

```typescript
// 1. Discovery (from database)
const extensions = await Extension.dbApi.from().select();

// 2. Registration (Module Federation)
await registerRemotes(extensions.map(ext => ({
  name: `extension_${ext.id}`,
  entry: `${REGISTRY_URL}/${ext.id}/${ext.version}/remoteEntry.js`,
})));

// 3. Loading
await extension.load(); // Fetches remote module

// 4. Initialization
await extension.initialize(); // Calls IExtension.initialize()

// 5. Activation
await extension.activate(); // Calls IExtension.activate()

// Extension can now register custom components, resolvers, storages
```

**Extension Development Structure:**

```
extensions/my-extension/
├── src/
│   ├── Extension.ts           # IExtension implementation
│   ├── resolver.ts            # Custom resolver
│   ├── schema.ts              # Zod schemas
│   └── components/
│       └── ContentComponent.vue
├── package.json
└── vite.config.ts             # Module Federation config
```

**Extension Capabilities:**

- Register custom resolvers for new content types
- Register custom storage handlers
- Add UI components to host app
- Extend business logic
- Add new API endpoints (via core-py integration)

### Component Architecture

Components are organized by business domain with clear separation of concerns.

**Organization:**

```
components/
├── <domain>/                  # Domain-specific components
│   └── <feature>/             # Feature subfolder
│       ├── <Feature>.vue      # Main component
│       ├── <Feature>.scss     # Styles
│       └── sub-components/    # Feature subcomponents
```

**Domain Categories:**

- **source**: Source cards, forms, collection job UI
- **info-base**: Block nodes, relation edges, graph controls
- **extension**: Extension cards, install UI
- **client**: Client lists, connection status
- **obsrv**: Log viewers, monitoring UI
- **common**: Shared components (side panels, layouts)

**Component Patterns:**

**1. BusinessClass Props:**

```typescript
// Use prop factories for type safety
const props = defineProps({
  source: makeSourceProp(),
  sourceRef: makeSourceRefProp(),
});

// Load from ref if needed
const source = ref<Source>();
if (props.sourceRef) {
  source.value = await Source.get(props.sourceRef);
}
```

**2. Resolver Content Components:**

```typescript
// Receive pre-resolved content from resolver
defineProps<ContentCompProps<TweetSolvedContent>>();

// Content is already loaded, just render
<template>
  <div>{{ solvedContent.text }}</div>
</template>
```

**3. Async State Handling:**

```typescript
import { useAsyncState } from '@/composables/use-async-state';

const { state, data, execute } = useAsyncState(
  () => Source.list(),
  []
);

// state: 'idle' | 'loading' | 'success' | 'error'
```

### State Management

Pinia stores for global reactive state.

**Current Stores:**

**Auth Store:**

```typescript
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  
  async function getToken(): Promise<string> {
    if (!token.value) {
      // Fetch or refresh token
    }
    return token.value;
  }
  
  async function login(credentials: LoginCredentials): Promise<void> {
    // JWT authentication
  }
  
  async function logout(): Promise<void> {
    token.value = null;
    user.value = null;
  }
  
  return { token, user, getToken, login, logout };
});
```

**State Management Principles:**

- Use Pinia for global state (auth, app config)
- Use local reactive state for component-specific data
- BusinessClass instances provide their own state via static registries
- Composables for reusable stateful logic

### Routing and Views

Vue Router with typed routes and view components.

**Route Structure:**

```typescript
const routes = [
  { path: '/', name: 'InKCre', component: start },
  { path: '/sources', name: 'Sources', component: sources },
  { path: '/sources/:id', name: 'Source', component: source },
  { path: '/sources/collectJob/:id', name: 'SourceCollectJob', component: sourceCollectJob },
  { path: '/extensions', name: 'Extensions', component: extensions },
  { path: '/info-base/graph', name: 'InfoBaseGraph', component: infoBaseGraph },
  { path: '/settings', name: 'Settings', component: settings },
];
```

**View Components:**
Each view represents a page/route:

- **start**: Landing page
- **sources**: List and manage sources
- **source**: Individual source details
- **sourceCollectJob**: Collection job monitoring
- **extensions**: Extension marketplace and management
- **infoBaseGraph**: Interactive graph visualization
- **settings**: Application settings

**View Patterns:**

- Load data in `onMounted` hook
- Use composables for complex state (e.g., graph layouts)
- Delegate UI to domain-specific components
- Handle route params for entity detail views

### Configuration Management

Multi-adapter configuration system using `zod-config`.

**Architecture:**

```typescript
// 1. Define schema
const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.url().default(""),
  INKCRE_PGREST_URL: z.url().default(""),
  // ...
});

// 2. Create adapters
const adapters = {
  localStorage: { read, write },
  http: { read, write },
  dev: { read, write },
};

// 3. Load config
const CONFIG = ref<Config>(await loadConfig());

// 4. Save config
await setConfig({ INKCRE_CORE_URL: "https://..." });
```

**Adapter Selection:**

```typescript
// Stored in localStorage
const currentAdapter = localStorage.getItem('inkcre_config_adapter') || 'dev';

// Switch adapter
await switchAdapter('localStorage');
```

**Benefits:**

- Type-safe configuration
- Runtime validation
- Multiple sources (env, localStorage, HTTP)
- Runtime adapter switching
- Default values from schema

### Internationalization

Vue I18n for multi-language support.

**Structure:**

```
locales/
├── index.ts
└── messages/
    ├── en.json
    └── zh-CN.json
```

**Usage:**

```typescript
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// In template
<h1>{{ t('welcome.title') }}</h1>

// In script
const message = t('welcome.message', { name: 'User' });
```

**Message Structure:**

```json
{
  "welcome": {
    "title": "Welcome to InKCre",
    "message": "Hello, {name}!"
  },
  "source": {
    "create": "Create Source",
    "list": "Source List"
  }
}
```

---

## Data Flow

### Read Flow (Fetching Data)

```
User Action (e.g., click "Sources")
    ↓
View Component (sources.vue)
    ↓
    onMounted() → Source.list()
    ↓
BusinessClass Static Method
    ↓
    Source.dbApi.from().select()
    ↓
DBAPIClient
    ↓
    PostgrestClient.from('sources').select()
    ↓
PostgREST API
    ↓
PostgreSQL Database
    ↓
Response JSON
    ↓
DBAPIClient parses response
    ↓
BusinessClass.parse() → Zod validation
    ↓
Array<Source> instances
    ↓
Reactive state update
    ↓
Vue re-renders component
```

### Write Flow (Saving Data)

```
User Action (e.g., submit form)
    ↓
Component event handler
    ↓
Create BusinessClass instance
    const source = new Source({ nickname: '...' });
    ↓
Call instance method
    await source.save()
    ↓
BusinessClass method
    ↓
    this.coreApi.request({ method: 'POST', ... })
    ↓
CoreAPIClient
    ↓
    fetch(INKCRE_CORE_URL + '/sources', { body: JSON.stringify(source) })
    ↓
core-py REST API
    ↓
    - Validate request
    - Business logic
    - Database write
    ↓
Response
    ↓
BusinessClass.parse() validates response
    ↓
Update local state
    ↓
Vue re-renders UI
```

### Extension Flow (Loading Plugin)

```
Extension.activate()
    ↓
Check if already loaded
    if (status === LOADED) skip
    ↓
Register remote (Module Federation)
    registerRemotes([{ name: 'extension_twitter', entry: 'https://...' }])
    ↓
Load remote module
    const module = await loadRemote('extension_twitter/Extension')
    ↓
Instantiate extension
    const ext = new module.default()
    ↓
Initialize
    await ext.initialize()
    - Register custom resolvers: Resolver.registerHandler('tweet', TweetResolver)
    - Register custom storages: Storage.registerHandler('twitter-api', TwitterStorage)
    ↓
Activate
    await ext.activate()
    - Start background tasks
    - Register UI components
    ↓
Extension state: ACTIVE
    ↓
Extension features available in app
```

### Content Resolution Flow (Resolver)

```
Component needs to display block content
    ↓
Get resolver
    const resolver = await Resolver.fromBlock(block);
    ↓
ResolverManager.getByType(block.resolver)
    ↓
Instantiate resolver with block
    new TweetResolver(block)
    ↓
Get solved content
    const content = await resolver.getSolvedContent();
    ↓
Check cache
    if (solvedContentCache) return cache
    ↓
Fetch storage
    const storage = await Storage.fromId(block.storage);
    const rawContent = await storage.getRawContent(block);
    ↓
Resolve content
    const solvedContent = await _resolveSolvedContent(rawContent);
    ↓
Cache result
    solvedContentCache = solvedContent
    ↓
Return to component
    ↓
Render via contentComp
    <component :is="resolver.contentComp" :solvedContent="content" />
```

---

## Build & Deployment

### Development Workflow

**Setup:**

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Start dev server with all extensions
pnpm dev:all
```

**Development servers:**

- Host app: `http://localhost:5173`
- Extensions: `http://localhost:5174+` (incremental ports)

**Hot Module Replacement:**

- Vite provides instant HMR for components, styles, business logic
- Extension changes require page refresh

### Build Process

**Build Commands:**

```bash
# Type check
pnpm type-check

# Build host app
pnpm build

# Build extensions
pnpm build:ext

# Build everything
pnpm build:all
```

**Build Output:**

```
dist/
├── assets/
│   ├── index-[hash].js        # Main bundle
│   ├── [component]-[hash].js  # Code-split chunks
│   └── [component]-[hash].css # Styles
├── index.html
└── ...
```

**Vite Configuration:**

```typescript
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools(), UnoCSS()],
  resolve: {
    alias: { '@': './src' },
  },
  build: {
    target: 'esnext',
    sourcemap: 'inline',
  },
});
```

**Extension Build (Module Federation):**

```typescript
// extensions/twitter/vite.config.ts
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'extension_twitter',
      filename: 'remoteEntry.js',
      exposes: {
        './Extension': './src/Extension.ts',
      },
      shared: ['vue', 'zod', '@vue-flow/core'],
    }),
  ],
});
```

### Deployment

**Cloudflare Workers:**

```bash
# Build for Cloudflare
pnpm build -- --mode cloudflare

# Deploy
pnpm deploy:cf
```

**Deployment Process:**

1. Load `.env.cloudflare` environment variables
2. Build with Cloudflare Workers adapter
3. Package with Hono server routes
4. Deploy via Wrangler CLI

**Wrangler Configuration:**

```jsonc
// wrangler.jsonc
{
  "name": "inkcre-web",
  "main": "server/index.ts",
  "compatibility_date": "2024-01-01",
  "routes": [
    { "pattern": "app.inkcre.com/*", "zone_name": "inkcre.com" }
  ]
}
```

**Server Routes (Hono):**

```typescript
// server/index.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/config', async (c) => {
  return c.json({ /* config */ });
});

app.get('/health', (c) => c.text('OK'));

export default app;
```

### Environment Variables

**Development (`.env`):**

```env
VITE_INKCRE_CORE_URL=http://localhost:8000
VITE_INKCRE_PGREST_URL=http://localhost:3000
VITE_INKCRE_EXTENSION_REGISTRY_URL=http://localhost:5174
VITE_INKCRE_JWT_SECRET=dev-secret
VITE_INKCRE_CLIENT_ID=local-dev-client-uuid
```

**Production (`.env.cloudflare`):**

```env
VITE_INKCRE_CORE_URL=https://api.inkcre.com
VITE_INKCRE_PGREST_URL=https://db.inkcre.com
VITE_INKCRE_EXTENSION_REGISTRY_URL=https://extensions.inkcre.com
VITE_INKCRE_JWT_SECRET=<production-secret>
VITE_INKCRE_CLIENT_ID=<production-client-uuid>
```

---

## Extension Development

### Creating an Extension

**Step 1: Initialize Extension Directory**

```bash
cd extensions
mkdir my-extension
cd my-extension
pnpm init
```

**Step 2: Install Dependencies**

```json
{
  "name": "@inkcre/extension-my-extension",
  "type": "module",
  "dependencies": {
    "vue": "^3.5.0",
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "@module-federation/vite": "^1.1.0",
    "vite": "^7.0.0"
  }
}
```

**Step 3: Configure Vite**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'extension_my_extension',
      filename: 'remoteEntry.js',
      exposes: {
        './Extension': './src/Extension.ts',
      },
      shared: {
        vue: { singleton: true },
        zod: { singleton: true },
      },
    }),
  ],
});
```

**Step 4: Implement Extension**

```typescript
// src/Extension.ts
import type { IExtension } from '@inkcre/web/business/extension';
import { Resolver } from '@inkcre/web/business/info-base/resolver';
import MyResolver from './resolver';

export default class MyExtension implements IExtension {
  async initialize(): Promise<void> {
    console.log('[MyExtension] Initializing...');
    
    // Register custom resolver
    Resolver.registerHandler('my-content-type', MyResolver);
  }
  
  async activate(): Promise<void> {
    console.log('[MyExtension] Activated!');
  }
  
  async deactivate(): Promise<void> {
    console.log('[MyExtension] Deactivated');
  }
  
  async dispose(): Promise<void> {
    console.log('[MyExtension] Disposed');
  }
}
```

**Step 5: Create Custom Resolver**

```typescript
// src/resolver.ts
import { Resolver } from '@inkcre/web/business/info-base/resolver';
import ContentComponent from './components/ContentComponent.vue';

@Resolver.registry('my-content-type')
export default class MyResolver extends Resolver<RawContentT, SolvedContentT> {
  readonly type = 'my-content-type';
  readonly contentComp = ContentComponent;
  
  async _resolveSolvedContent(rawContent: RawContentT): Promise<SolvedContentT> {
    // Transform raw content
    return { ...rawContent, processed: true };
  }
}
```

**Step 6: Create Content Component**

```vue
<!-- src/components/ContentComponent.vue -->
<script setup lang="ts">
import type { ContentCompProps } from '@inkcre/web/business/info-base/resolver';

defineProps<ContentCompProps<SolvedContentT>>();
</script>

<template>
  <div class="my-content">
    {{ solvedContent }}
  </div>
</template>
```

**Step 7: Build Extension**

```bash
pnpm build
```

**Step 8: Register in Database**

```sql
INSERT INTO extensions (id, version, enabled, config)
VALUES ('my-extension', '1.0.0', ARRAY['client-uuid'], '{}');
```

### Extension Capabilities

**1. Custom Resolvers**
Handle new content types (e.g., PDF, audio, 3D models)

**2. Custom Storages**
Integrate with external storage services (S3, IPFS, etc.)

**3. UI Components**
Add new views, widgets, or modify existing UI

**4. Background Tasks**
Run periodic jobs during activation

**5. API Integration**
Extend core-py API with custom endpoints

### Extension Best Practices

- **Singleton shared dependencies**: Use `singleton: true` for vue, zod, etc.
- **Versioning**: Follow semantic versioning
- **Error handling**: Wrap operations in try-catch
- **Cleanup**: Implement `dispose()` to clean up resources
- **Testing**: Test in isolation before integration
- **Documentation**: Provide README with usage instructions

---

## Key Design Decisions

### 1. Why BusinessClass Pattern?

**Problem:**

- Duplicate type definitions (Zod schema + TypeScript type)
- Inconsistent validation across entities
- Scattered API logic

**Solution:**

- Single source of truth: Zod schema generates TypeScript types
- Built-in validation via Zod
- Centralized API clients per entity
- Consistent patterns for CRUD operations

**Trade-offs:**

- Learning curve for zod-class
- Some boilerplate for static registries
- But: Type safety, consistency, and maintainability outweigh costs

### 2. Why Dual API Architecture?

**Problem:**

- PostgREST is great for simple queries but lacks business logic
- REST API provides validation but slower for simple CRUD

**Solution:**

- DBAPIClient for fast, direct database access (list, filter, simple CRUD)
- CoreAPIClient for complex operations (validation, orchestration, batch)

**Trade-offs:**

- Two clients to maintain
- But: Performance for common operations, flexibility for complex ones

### 3. Why Module Federation for Extensions?

**Alternatives Considered:**

- **iframe**: Isolation but communication overhead, no shared state
- **Web Components**: Good isolation but Vue integration complexity
- **Dynamic imports**: No true isolation, versioning issues

**Module Federation Benefits:**

- True runtime plugin loading
- Shared dependencies (Vue, Zod) - single runtime instance
- Version management
- Strong isolation with shared context

**Trade-offs:**

- Complex build setup
- Debugging across remotes can be challenging
- But: Flexibility and extensibility are critical for InKCre

### 4. Why Registry Pattern for Storage/Resolver?

**Problem:**

- Need extensibility for content types
- Type safety for content handling
- Lazy loading of implementations

**Solution:**

- Decorator-based registration
- Generic types for content
- Factory methods for instantiation

**Trade-offs:**

- Decorator syntax learning curve
- But: Clean extension API, type safety, discoverability

### 5. Why Config Adapter System?

**Problem:**

- Different environments need different config sources
- Hard-coded configs make deployment inflexible

**Solution:**

- Multiple adapters (localStorage, HTTP, env)
- Runtime switching
- Zod validation for all sources

**Trade-offs:**

- Abstraction complexity
- But: Flexibility for dev/prod, runtime reconfiguration

### 6. Why Pinia Over Vuex?

**Rationale:**

- Composition API native
- Better TypeScript support
- Simpler API (no mutations)
- Automatic tree-shaking

### 7. Why Domain-Based Component Organization?

**Rationale:**

- Co-location of related components
- Clear ownership by business domain
- Easier to find and maintain components
- Natural alignment with business layer structure

### 8. Why Cloudflare Workers?

**Rationale:**

- Edge deployment for low latency
- Serverless scaling
- Simple deployment workflow
- Cost-effective for static + API

**Trade-offs:**

- Limited Node.js APIs
- But: Client-web is primarily static with simple API routes

---

## Getting Started

### Prerequisites

- **Node.js**: `^20.19.0 || >=22.12.0`
- **pnpm**: `10.26.2` (specified in package.json)
- **Git**: For version control

### Installation

```bash
# Clone repository
git clone <repository-url>
cd client-web

# Install dependencies
pnpm install
```

### Configuration

**Option 1: Development Mode (default)**

```bash
# Uses .env file (create from .env.example if needed)
cp .env.example .env

# Edit .env with your values
VITE_INKCRE_CORE_URL=http://localhost:8000
VITE_INKCRE_PGREST_URL=http://localhost:3000
# ...
```

**Option 2: Runtime Configuration**

```typescript
// In app, go to Settings → Configuration
// Switch to localStorage adapter
// Enter configuration values
// They'll persist in browser localStorage
```

### Running Development Server

```bash
# Start host app only
pnpm dev

# Start host + all extensions
pnpm dev:all
```

Navigate to `http://localhost:5173`

### Key Commands

```bash
# Development
pnpm dev                  # Start dev server
pnpm dev:all              # Start dev server + extensions

# Building
pnpm type-check           # TypeScript check
pnpm build                # Build host app
pnpm build:ext            # Build extensions
pnpm build:all            # Build everything

# Deployment
pnpm deploy:cf            # Deploy to Cloudflare Workers

# Code Quality
pnpm format               # Format with Prettier
```

### Project Structure Quick Reference

- **Business logic**: [`src/business/`](src/business)
- **Components**: [`src/components/`](src/components)
- **Views**: [`src/views/`](src/views)
- **Extensions**: [`extensions/`](extensions)
- **Configuration**: [`src/config.ts`](src/config.ts)
- **API clients**: [`src/business/api.ts`](src/business/api.ts)

### Next Steps

1. **Understand BusinessClass pattern**: Read [src/business/base.ts](src/business/base.ts) and [src/business/source.ts](src/business/source.ts)
2. **Explore extension system**: Check [extensions/twitter/](extensions/twitter) example
3. **Study resolver pattern**: Review [src/business/info-base/resolver.ts](src/business/info-base/resolver.ts)
4. **Review component structure**: Browse [src/components/](src/components)
5. **Read domain docs**: See [docs/](docs) folder for specific topics

---

## References

### Domain-Specific Documentation

- [docs/resolver.md](docs/resolver.md) - Resolver system architecture
- [docs/tokens.md](docs/tokens.md) - Authentication and JWT tokens
- [docs/todo.md](docs/todo.md) - Development roadmap and tasks
- [docs/vueuse.md](docs/vueuse.md) - VueUse composables usage
- [docs/figma-to-code.md](docs/figma-to-code.md) - Design-to-code workflow

### Instruction Files

- [AGENTS.md](AGENTS.md) - Guidelines for AI coding agents
- [extensions/AGENTS.md](extensions/AGENTS.md) - Extension development guidelines
- [src/business/AGENTS.md](src/business/AGENTS.md) - Business layer guidelines
- [src/components/AGENTS.md](src/components/AGENTS.md) - Component development guidelines

### External Documentation

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Zod Documentation](https://zod.dev/)
- [Module Federation](https://module-federation.io/)
- [PostgREST API](https://postgrest.org/)
- [Vite Documentation](https://vitejs.dev/)
- [UnoCSS Documentation](https://unocss.dev/)
- [Vue Flow Documentation](https://vueflow.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### Code Examples

Key files to study for understanding architectural patterns:

- **BusinessClass**: [src/business/source.ts](src/business/source.ts), [src/business/client.ts](src/business/client.ts)
- **Extension System**: [src/business/extension.ts](src/business/extension.ts), [src/business/mf-plugins/index.ts](src/business/mf-plugins/index.ts)
- **Resolver System**: [src/business/info-base/resolver.ts](src/business/info-base/resolver.ts)
- **Storage System**: [src/business/info-base/storage.ts](src/business/info-base/storage.ts)
- **API Clients**: [src/business/api.ts](src/business/api.ts)
- **Config System**: [src/config.ts](src/config.ts)

---

**Last Updated**: January 2, 2026
