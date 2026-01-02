# Extension System Architecture

## Table of Contents

- Overview
- Extension Structure
- Development Setup
- IExtension Interface
- Module Federation Integration
- Extension Capabilities
- Lifecycle Management
- Deployment

---

## Overview

The InKCre Extension System enables dynamic loading of third-party plugins without host application recompilation. Extensions enhance the info-base system by adding custom resolvers, storages, and components.

### Architecture

```
┌─────────────────────────────────────────────┐
│           Host Application                   │
│  ┌─────────────────────────────────────┐   │
│  │  Extension Manager                   │   │
│  │  - Discovery                         │   │
│  │  - Lifecycle management              │   │
│  │  - Module Federation runtime         │   │
│  └───────────┬─────────────────────────┘   │
│              │ loads                        │
│  ┌───────────▼─────────────────────────┐   │
│  │  Module Federation Runtime           │   │
│  │  - Remote module loading             │   │
│  │  - Shared dependency deduplication   │   │
│  │  - Version resolution                │   │
│  └───────────┬─────────────────────────┘   │
└──────────────┼──────────────────────────────┘
               │ HTTP
               ↓
┌──────────────────────────────────────────────┐
│      Extension Registry (CDN/Server)         │
│  /twitter/client-web/remoteEntry.js          │
│  /notion/client-web/remoteEntry.js           │
│  /...                                         │
└──────────────────────────────────────────────┘

Extension Runtime:
┌──────────────────────────────────────────────┐
│  Extension Module                            │
│  ┌────────────────────────────────────────┐ │
│  │ Extension.ts (IExtension impl)         │ │
│  │  - initialize() → register resolvers  │ │
│  │  - activate() → start services         │ │
│  │  - deactivate() → pause services       │ │
│  │  - dispose() → cleanup                 │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │ Resolvers/Storages                     │ │
│  │  - Register in host's global registry  │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │ Components                              │ │
│  │  - Content display components          │ │
│  │  - Use host's Vue instance             │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Key Features

- **Dynamic Loading**: Runtime extension loading without rebuild
- **Module Federation**: Webpack Module Federation for remote modules
- **Shared Dependencies**: Single instances of Vue, Pinia, Router across host and extensions
- **Type Safety**: TypeScript with host type imports
- **Lifecycle Hooks**: Initialize, activate, deactivate, dispose
- **Versioning**: Extension versions tracked in database
- **Isolation**: Each extension as independent npm package

### Goals

1. **Extensibility**: Enable third-party extension development
2. **Safety**: Isolated extension execution contexts
3. **Performance**: Lazy loading and shared dependencies
4. **Developer Experience**: TypeScript support, hot reload, debugging
5. **Flexibility**: Extensions can enhance any system part

---

## Extension Structure

### Directory Layout

```
extensions/
├── AGENTS.md                    # Extension development guidelines
├── ARCHITECTURE.md              # This file
├── package.json                 # Workspace package (optional)
├── vite.config.ts               # Shared config (optional)
└── {extension-id}/              # Each extension is a folder
    ├── package.json             # Extension dependencies
    ├── tsconfig.json            # TypeScript config with @host alias
    ├── vite.config.ts           # Vite + Module Federation config
    └── src/
        ├── Extension.ts         # IExtension implementation (required)
        ├── index.ts             # Local dev entry (optional)
        ├── resolver.ts          # Resolver implementations
        ├── storage.ts           # Storage implementations (optional)
        ├── schema.ts            # Zod schemas for data types
        └── components/          # Vue components
            └── ContentTweet.vue # Content display component
```

### Naming Conventions

- **Extension ID**: `{extension-id}` - Folder name, lowercase, hyphens
- **Remote Name**: `extension_{extension-id}` - Module Federation name
- **Package Name**: `@inkcre/extension-{extension-id}` - npm package name
- **Entry File**: `src/Extension.ts` - Must export `IExtension` as default

### File Purposes

| File | Purpose | Required |
|------|---------|----------|
| `Extension.ts` | IExtension implementation, lifecycle hooks | ✓ |
| `resolver.ts` | Resolver classes with registry decorators | Recommended |
| `storage.ts` | Storage classes with registry decorators | Optional |
| `schema.ts` | Zod schemas for content types | Recommended |
| `components/` | Vue components for content display | Recommended |
| `index.ts` | Local dev entry (not exposed to host) | Optional |

---

## Development Setup

### High-Level Steps

1. **Create Extension Folder**: Set up directory structure under
2. **Configure**: Define build tools as devDependencies, host-provided libraries as peerDependencies
3. **Set TypeScript Config**: Extend host tsconfig, add `@host` path alias for host type imports
4. **Configure Vite**: Enable Module Federation, expose Extension export, configure shared dependencies matching host versions
5. **Implement IExtension**: Create lifecycle hook implementations in Extension.ts
6. **Register Components**: Use decorators to register resolvers/storages in global registry
7. **Build and Test**: Use local development setup, then build for deployment

---

## IExtension Interface

### Interface Definition

```typescript
export interface IExtension {
  /**
   * Called once when extension is first loaded.
   * Use for registering resolvers/storages and initializing state.
   */
  initialize(): Promise<void>;

  /**
   * Called when extension is activated (enabled by user).
   * Use for starting services and setting up event listeners.
   */
  activate(): Promise<void>;

  /**
   * Called when extension is deactivated (disabled by user).
   * Use for pausing services and removing event listeners.
   */
  deactivate(): Promise<void>;

  /**
   * Called when extension is unloaded.
   * Use for resource cleanup and final teardown.
   */
  dispose(): Promise<void>;
}
```

### Key Methods

- **initialize()**: One-time setup, register types via decorators
- **activate()**: Start extension when user enables it
- **deactivate()**: Pause extension when user disables it
- **dispose()**: Cleanup when extension is unloaded

---

## Module Federation Integration

### Core Concepts

**Remote Entry URL Pattern**:

```
{INKCRE_EXTENSION_REGISTRY_URL}/{extension-id}/client-web/remoteEntry.js?version={version}
```

**Host Configuration**:

- Initializes Module Federation runtime with shared dependencies
- Registers remote modules dynamically at runtime
- Manages extension loading lifecycle through plugins

**Shared Dependencies**:

- `vue`, `pinia`, `vue-router`, `@vueuse/core`, `zod`
- Singleton instances prevent state fragmentation
- Version constraints ensure compatibility

**Loading Process**:

1. Extension discovered from database
2. Remote entry URL constructed with version
3. Module Federation runtime loads remoteEntry.js
4. Extension module executed, decorators register types
5. IExtension instance available for lifecycle calls

---

## Extension Capabilities

### 1. Resolver Registration

Extensions can define custom resolvers that transform raw content into structured data. Resolvers register via decorators and provide Vue components for content display.

### 2. Storage Registration

Extensions can define custom storages for fetching binary content like images or documents. Storages handle external API calls and data retrieval.

### 3. Host API Access

Extensions import host types and APIs using `@host` alias:

- Block and Relation creation/management
- Configuration access
- Store usage (Pinia)
- Router integration

### 4. Component Integration

Extensions provide Vue components that integrate seamlessly with host's reactive system. Components use host's Vue instance and can access shared composables.

---

## Lifecycle Management

### Extension States

```typescript
export enum ExtensionState {
  DISCOVERED = "DISCOVERED",   // Found in database
  LOADING = "LOADING",          // Loading remoteEntry.js
  LOADED = "LOADED",            // Module loaded, not initialized
  INITIALIZING = "INITIALIZING", // Calling initialize()
  READY = "READY",              // Initialized, ready to activate
  ACTIVATING = "ACTIVATING",    // Calling activate()
  ACTIVE = "ACTIVE",            // Running
  DEACTIVATING = "DEACTIVATING", // Calling deactivate()
  UNLOADING = "UNLOADING",      // Calling dispose()
  UNLOADED = "UNLOADED",        // Fully unloaded
  ERROR = "ERROR",              // Error occurred
}
```

### State Transitions

```
┌──────────┐
│DISCOVERED│ (from database)
└────┬─────┘
     │ loadModule()
     ↓
┌────────┐
│LOADING │
└────┬───┘
     │ success
     ↓
┌──────┐
│LOADED│
└──┬───┘
   │ initialize()
   ↓
┌──────────────┐
│INITIALIZING  │
└───────┬──────┘
        │ success
        ↓
   ┌────────┐
   │ READY  │ ←─────┐
   └───┬────┘       │
       │            │
       │ activate() │ deactivate()
       ↓            │
   ┌───────────┐    │
   │ACTIVATING │    │
   └─────┬─────┘    │
         │ success  │
         ↓          │
     ┌──────┐       │
     │ACTIVE│───────┘
     └──────┘
         │ dispose()
         ↓
   ┌──────────┐
   │UNLOADING │
   └─────┬────┘
         │
         ↓
   ┌─────────┐
   │UNLOADED │
   └─────────┘

   (any transition can fail → ERROR)
```

### Key Differences

- **DISCOVERED vs LOADED**: Module not yet loaded from registry
- **READY vs ACTIVE**: Initialized but not running services
- **ACTIVE vs READY**: User-enabled state vs disabled state
- **UNLOADED vs ERROR**: Successful cleanup vs failure state

---

## Deployment

### Key Differences from Regular Apps

**Build Output**:

- Produces `remoteEntry.js` as entry point
- Assets organized under `client-web/` directory
- No standalone HTML, integrates into host application

**Registry Hosting**:

- Extensions hosted on CDN or server
- Versioned URLs for cache busting
- Database tracks available extensions

**Versioning Strategy**:

- Semantic versioning for compatibility
- URL parameters for version specification
- Multiple versions can coexist

**User Installation**:

- Extensions discovered through database metadata
- Enabled per client/user
- Runtime loading without host restart

---

**Last Updated**: January 2, 2026
