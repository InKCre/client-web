# Extension System Architecture

## Table of Contents

- [Overview](#overview)
- [Extension Structure](#extension-structure)
- [Development Setup](#development-setup)
- [IExtension Interface](#iextension-interface)
- [Module Federation Integration](#module-federation-integration)
- [Extension Capabilities](#extension-capabilities)
- [Lifecycle Management](#lifecycle-management)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Best Practices](#best-practices)
- [Twitter Extension Example](#twitter-extension-example)
- [Troubleshooting](#troubleshooting)
- [References](#references)

---

## Overview

The **InKCre Extension System** enables dynamic loading of third-party plugins without requiring host application recompilation. Extensions can add custom resolvers, storages, and components to enhance the info-base system.

### Architecture

```
┌─────────────────────────────────────────────┐
│           Host Application                   │
│  ┌─────────────────────────────────────┐   │
│  │  Extension Manager (extension.ts)   │   │
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
│  Extension Module (twitter)                  │
│  ┌────────────────────────────────────────┐ │
│  │ Extension.ts (IExtension impl)         │ │
│  │  - initialize() → register resolvers  │ │
│  │  - activate() → start services         │ │
│  │  - deactivate() → pause services       │ │
│  │  - dispose() → cleanup                 │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │ Resolvers/Storages                     │ │
│  │  - @registry decorators                │ │
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

- **Dynamic Loading**: Load extensions at runtime without rebuild
- **Module Federation**: Webpack Module Federation v2 for remote modules
- **Shared Dependencies**: Single instance of Vue, Pinia, Router across host and extensions
- **Type Safety**: TypeScript with `@host` alias for host type imports
- **Lifecycle Hooks**: Initialize, activate, deactivate, dispose
- **Versioning**: Extension versions tracked in database
- **Isolation**: Each extension is an independent npm package

### Goals

1. **Extensibility**: Anyone can develop extensions
2. **Safety**: Extensions run in isolated contexts
3. **Performance**: Lazy loading, shared dependencies
4. **Developer Experience**: TypeScript, hot reload, debugging
5. **Flexibility**: Extensions can enhance any part of the system

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
| `resolver.ts` | Resolver classes with `@registry` decorators | Recommended |
| `storage.ts` | Storage classes with `@registry` decorators | Optional |
| `schema.ts` | Zod schemas for content types | Recommended |
| `components/` | Vue components for content display | Recommended |
| `index.ts` | Local dev entry (not exposed to host) | Optional |

---

## Development Setup

### 1. Create Extension Folder

```bash
cd extensions
mkdir my-extension
cd my-extension
```

### 2. Package.json

**Template** (`package.json`):

```json
{
  "name": "@inkcre/extension-my-extension",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@module-federation/vite": "^1.1.0",
    "@vitejs/plugin-vue": "^6.0.1",
    "@vitejs/plugin-vue-jsx": "^5.1.2",
    "sass-embedded": "^1.90.0",
    "typescript": "~5.8.0",
    "vite": "^7.0.6"
  },
  "peerDependencies": {
    "vue": "^3.5.0",
    "pinia": "^3.0.0",
    "vue-router": "^4.5.0",
    "@vueuse/core": "^14.0.0",
    "zod": "^4.1.0"
  }
}
```

**Key Points**:

- **devDependencies**: Build tools only
- **peerDependencies**: Provided by host, must match host versions
- **No dependencies**: All runtime deps should be peer dependencies

### 3. TypeScript Configuration

**Template** (`tsconfig.json`):

```json
{
  "extends": "../../tsconfig.app.json",
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@host/*": ["../../src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

**`@host` Alias**: Import host types without bundling them

```typescript
import type { IExtension } from "@host/business/extension";
import { BaseResolver } from "@host/business/info-base/resolver";
```

### 4. Vite Configuration

**Template** (`vite.config.ts`):

```typescript
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { federation } from "@module-federation/vite/rspack";

const extensionId = "my-extension"; // CHANGE THIS

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: `extension_${extensionId}`,
      filename: "remoteEntry.js",
      exposes: {
        "./Extension": "./src/Extension.ts", // Required export
      },
      shared: {
        // Match host's shared dependencies
        vue: { singleton: true, requiredVersion: "^3.5.0" },
        pinia: { singleton: true, requiredVersion: "^3.0.0" },
        "vue-router": { singleton: true, requiredVersion: "^4.5.0" },
        "@vueuse/core": { singleton: true, requiredVersion: "^14.0.0" },
        zod: { singleton: true, requiredVersion: "^4.0.0" },
      },
    }),
  ],
  resolve: {
    alias: {
      "@host": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  server: {
    port: 5174, // Unique port per extension
    origin: `http://localhost:5173/${extensionId}/client-web`,
  },
  build: {
    target: "esnext",
    outDir: "dist/client-web",
  },
});
```

**Key Configurations**:

- **name**: Unique remote name (`extension_{id}`)
- **exposes**: Must export `./Extension`
- **shared**: Must match host's shared dependencies exactly
- **@host alias**: Resolves to `../../src`
- **port**: Unique dev server port
- **origin**: Expected URL pattern for loading

---

## IExtension Interface

### Interface Definition

**From `src/business/extension.ts`**:

```typescript
export interface IExtension {
  /**
   * Called once when extension is first loaded.
   * Use for:
   * - Registering resolvers/storages (via decorator side effects)
   * - Initializing extension state
   * - Loading configuration
   */
  initialize(): Promise<void>;

  /**
   * Called when extension is activated (enabled by user).
   * Use for:
   * - Starting background services
   * - Setting up event listeners
   * - Initializing UI
   */
  activate(): Promise<void>;

  /**
   * Called when extension is deactivated (disabled by user).
   * Use for:
   * - Pausing background services
   * - Removing event listeners
   * - Hiding UI
   */
  deactivate(): Promise<void>;

  /**
   * Called when extension is unloaded.
   * Use for:
   * - Cleaning up resources
   * - Closing connections
   * - Final teardown
   */
  dispose(): Promise<void>;
}
```

### Implementation Template

```typescript
import type { IExtension } from "@host/business/extension";

// Import resolver to trigger decorator registration
import "./resolver";
import "./storage"; // Optional

const Extension: IExtension = {
  async initialize() {
    console.log("[MyExtension] Initializing...");
    // Decorators have already registered resolvers/storages
    
    // Load extension config
    // Initialize extension state
  },

  async activate() {
    console.log("[MyExtension] Activated");
    // Start background services
    // Register event listeners
  },

  async deactivate() {
    console.log("[MyExtension] Deactivated");
    // Pause background services
    // Remove event listeners
  },

  async dispose() {
    console.log("[MyExtension] Disposed");
    // Final cleanup
    // Close connections
  },
};

export default Extension;
```

### Lifecycle Hooks Execution Order

```
Extension Discovery (from DB)
  ↓
Extension.loadModule() → Loads remoteEntry.js
  ↓
Extension module executed
  ├─ Decorators register types
  └─ IExtension default export available
  ↓
Extension.initialize() → Called by host
  ↓
Extension state: READY
  ↓
Extension.activate() → Called when enabled
  ↓
Extension state: ACTIVE
  ↓
... extension is running ...
  ↓
Extension.deactivate() → Called when disabled
  ↓
Extension state: READY
  ↓
Extension.dispose() → Called on unload
  ↓
Extension state: UNLOADED
```

---

## Module Federation Integration

### Remote Entry URL

**Pattern**:

```
{INKCRE_EXTENSION_REGISTRY_URL}/{extension-id}/client-web/remoteEntry.js?version={version}
```

**Example**:

```
https://cdn.inkcre.dev/extensions/twitter/client-web/remoteEntry.js?version=0.1.0
```

### Host Configuration

**From `src/business/mf-plugins/index.ts`**:

```typescript
import { init } from "@module-federation/runtime";

// Initialize Module Federation runtime
export const mfInstance = init({
  name: "host",
  remotes: [],
  shared: {
    vue: { singleton: true, version: "3.5.18" },
    pinia: { singleton: true, version: "3.0.3" },
    "vue-router": { singleton: true, version: "4.5.1" },
    "@vueuse/core": { singleton: true, version: "14.0.0" },
    zod: { singleton: true, version: "4.1.12" },
  },
  plugins: [
    // Extension lifecycle hooks
    {
      name: "extension-lifecycle",
      beforeRequest(args) {
        console.log("[MF] Loading remote:", args.id);
        const ext = Extension.getByRemoteName(args.id);
        if (ext) ext.state = ExtensionState.LOADING;
        return args;
      },
      afterResolve(args) {
        console.log("[MF] Resolved remote:", args.id);
        const ext = Extension.getByRemoteName(args.id);
        if (ext) ext.state = ExtensionState.LOADED;
        return args;
      },
      onLoad(args) {
        console.log("[MF] Loaded remote:", args.id);
        return args;
      },
      errorLoadRemote(args) {
        console.error("[MF] Failed to load remote:", args.id, args.error);
        const ext = Extension.getByRemoteName(args.id);
        if (ext) ext.state = ExtensionState.ERROR;
        return args;
      },
    },
  ],
});
```

### Shared Dependencies

**Why Singleton?**

```typescript
// Without singleton:
// Host: Vue 3.5.18
// Extension: Vue 3.5.17
// → TWO instances, state fragmentation!

// With singleton:
shared: {
  vue: { singleton: true, requiredVersion: "^3.5.0" },
}
// → ONE shared instance, consistent state
```

**Shared Modules**:

- `vue` - Reactive system, components
- `pinia` - State management
- `vue-router` - Routing
- `@vueuse/core` - Composables
- `zod` - Schema validation

### Loading Extensions

**Extension Manager** (`src/business/extension.ts`):

```typescript
async loadModule(): Promise<void> {
  if (this.state !== ExtensionState.DISCOVERED) {
    throw new Error(`Cannot load extension in state: ${this.state}`);
  }

  const remoteEntryUrl = `${CONFIG.value.INKCRE_EXTENSION_REGISTRY_URL}/${this.id}/client-web/remoteEntry.js?version=${this.version}`;
  const remoteName = `extension_${this.id}`;

  // Register remote with MF runtime
  mfInstance.registerRemote(remoteName, {
    entry: remoteEntryUrl,
  });

  // Load remote module
  try {
    const module = await mfInstance.loadRemote<{ default: IExtension }>(
      `${remoteName}/Extension`
    );
    
    this._module = module.default;
    this.state = ExtensionState.LOADED;
  } catch (error) {
    this.state = ExtensionState.ERROR;
    throw error;
  }
}
```

---

## Extension Capabilities

### 1. Resolver Registration

**Define Resolver** (`src/resolver.ts`):

```typescript
import { BaseResolver } from "@host/business/info-base/resolver";
import { markRaw } from "vue";
import ContentTweet from "./components/ContentTweet.vue";
import type { Tweet } from "./schema";

@BaseResolver.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  protected async _getSolvedContent(): Promise<Tweet> {
    const tweetId = await this.getRawContent();
    
    // Fetch tweet data from Twitter API
    const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`);
    const data = await response.json();
    
    return {
      id: data.data.id,
      text: data.data.text,
      author: data.data.author_id,
      createdAt: new Date(data.data.created_at),
    };
  }
}
```

**Content Component** (`src/components/ContentTweet.vue`):

```vue
<script setup lang="ts">
import type { ContentCompProps } from "@host/business/info-base/resolver";
import type { Tweet } from "../schema";

const props = defineProps<ContentCompProps<Tweet>>();
</script>

<template>
  <div class="tweet">
    <div class="tweet-author">@{{ solvedContent.author }}</div>
    <div class="tweet-text">{{ solvedContent.text }}</div>
    <div class="tweet-date">{{ solvedContent.createdAt.toLocaleString() }}</div>
  </div>
</template>

<style scoped lang="scss">
.tweet {
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
```

**Import in Extension.ts**:

```typescript
import "./resolver"; // Triggers decorator registration
```

### 2. Storage Registration

**Define Storage** (`src/storage.ts`):

```typescript
import { Storage } from "@host/business/info-base/storage";
import type { Block } from "@host/business/info-base/block";

@Storage.registry("extensions.twitter.media")
export class TwitterMediaStorage extends Storage<Blob> {
  protected async _getRawContent(block: Block): Promise<Blob> {
    const mediaUrl = this.config.url || block.content;
    
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }
    
    return response.blob();
  }
}
```

### 3. Accessing Host APIs

**Import with @host alias**:

```typescript
import { Block, BlockForm } from "@host/business/info-base/block";
import { Relation } from "@host/business/info-base/relation";
import { CONFIG } from "@host/config";
import { useAuthStore } from "@host/stores/auth";

// Create blocks from extension
const form = new BlockForm({
  content: tweetId,
  resolver: "tweet",
  storage: null,
});
const block = await form.create();

// Create relations
const relation = new RelationForm({
  source: existingBlockId,
  target: block.id,
  type: "references",
});
await relation.create();
```

### 4. Using Host Composables

```typescript
import { useAsyncState } from "@vueuse/core";
import { computed } from "vue";

// VueUse composables work seamlessly
const { state, isLoading, execute } = useAsyncState(
  async () => {
    return fetchTweets();
  },
  []
);
```

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

### State Management Code

**From `src/business/extension.ts`**:

```typescript
async enable(clientId: ClientRef): Promise<void> {
  const client = await Client.get(clientId);
  
  if (!client.enabledExtensions.includes(this.id)) {
    client.enabledExtensions.push(this.id);
    await client.update();
  }

  // Load → Initialize → Activate
  if (this.state === ExtensionState.DISCOVERED) {
    await this.loadModule();
  }
  
  if (this.state === ExtensionState.LOADED) {
    await this.initialize();
  }
  
  if (this.state === ExtensionState.READY) {
    await this.activate();
  }
}

async disable(clientId: ClientRef): Promise<void> {
  const client = await Client.get(clientId);
  
  client.enabledExtensions = client.enabledExtensions.filter(
    id => id !== this.id
  );
  await client.update();

  if (this.state === ExtensionState.ACTIVE) {
    await this.deactivate();
  }
}
```

---

## Development Workflow

### 1. Local Development

**Start host + extension in parallel**:

```bash
# From workspace root
pnpm dev:all

# This runs:
# - Host: pnpm dev (port 5173)
# - All extensions: pnpm -r --filter './extensions/*' dev
```

**Or start individually**:

```bash
# Terminal 1: Host
pnpm dev

# Terminal 2: Extension
cd extensions/my-extension
pnpm dev
```

### 2. Hot Module Replacement

Extensions support HMR during development:

```typescript
if (import.meta.hot) {
  import.meta.hot.accept("./resolver.ts", (newModule) => {
    console.log("[HMR] Resolver updated");
    // Resolvers are auto-registered via decorators
  });
}
```

### 3. Testing Extensions

**Local Testing**:

```typescript
// In extension/src/index.ts (dev only, not exposed)
import { createApp } from "vue";
import App from "./App.vue";
import Extension from "./Extension";

// Test extension lifecycle
await Extension.initialize();
await Extension.activate();

const app = createApp(App);
app.mount("#app");
```

**Integration Testing**:

```typescript
// In host, temporarily register local extension
import localExtension from "@/../../extensions/my-extension/src/Extension";

const ext = new Extension({
  id: "my-extension-local",
  version: "dev",
  // ...
});

ext._module = localExtension;
await ext.initialize();
await ext.activate();
```

### 4. Debugging

**Browser DevTools**:

- Extensions appear as separate scripts in debugger
- Breakpoints work in extension code
- Console logs prefixed with `[ExtensionName]`

**Vue DevTools**:

- Extension components visible in component tree
- Pinia state shared with host
- Router shows extension routes (if any)

**MF DevTools**:

```typescript
// Check loaded remotes
console.log(mfInstance.remoteInfo);

// Check shared modules
console.log(mfInstance.shareScopeMap);
```

---

## Deployment

### 1. Build Extension

```bash
cd extensions/my-extension
pnpm build

# Output:
# dist/client-web/
#   ├── remoteEntry.js
#   ├── assets/
#   └── ...
```

### 2. Registry Structure

**Upload to extension registry**:

```
{REGISTRY_URL}/
└── {extension-id}/
    └── client-web/
        ├── remoteEntry.js        # Entry point
        ├── assets/               # Code chunks, styles, images
        │   ├── Extension.js
        │   ├── resolver.js
        │   └── ContentTweet.vue.js
        └── manifest.json         # Optional: version manifest
```

**Example**: CDN structure

```
https://cdn.inkcre.dev/extensions/
├── twitter/
│   └── client-web/
│       ├── remoteEntry.js
│       └── assets/
├── notion/
│   └── client-web/
│       ├── remoteEntry.js
│       └── assets/
```

### 3. Versioning

**Version in URL** (cache busting):

```
{REGISTRY_URL}/{extension-id}/client-web/remoteEntry.js?version={version}
```

**Multiple versions** (optional):

```
{REGISTRY_URL}/{extension-id}/
├── v0.1.0/
│   └── client-web/remoteEntry.js
├── v0.2.0/
│   └── client-web/remoteEntry.js
└── latest → v0.2.0/
```

### 4. Database Registration

**Insert extension metadata**:

```sql
INSERT INTO extensions (id, name, version, description, author, registry_url)
VALUES (
  'my-extension',
  'My Extension',
  '0.1.0',
  'Extension description',
  'author@example.com',
  'https://cdn.inkcre.dev/extensions'
);
```

**Users discover and enable** via Extensions view in UI.

---

## Best Practices

### 1. Security

**Validate all inputs**:

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  apiKey: z.string().min(1),
  url: z.url(),
});

// In initialize()
const config = ConfigSchema.parse(this.config);
```

**Sanitize content**:

```typescript
import DOMPurify from "dompurify";

protected async _getSolvedContent(): Promise<string> {
  const raw = await this.getRawContent();
  return DOMPurify.sanitize(raw);
}
```

**Use CORS proxies**:

```typescript
// Don't expose API keys in client
// Use host's proxy or serverless function
const response = await fetch(`/api/proxy/twitter/${tweetId}`);
```

### 2. Performance

**Lazy load heavy dependencies**:

```typescript
async function loadParser() {
  const { parse } = await import("heavy-parser-library");
  return parse;
}
```

**Cache expensive computations**:

```typescript
private _cachedData: Data | null = null;

protected async _getSolvedContent(): Promise<Data> {
  if (this._cachedData) return this._cachedData;
  
  this._cachedData = await expensiveOperation();
  return this._cachedData;
}
```

**Debounce API calls**:

```typescript
import { useDebounceFn } from "@vueuse/core";

const debouncedFetch = useDebounceFn(fetchData, 500);
```

### 3. State Isolation

**Don't pollute global scope**:

```typescript
// Bad
window.myExtensionData = {};

// Good
const extensionState = reactive({});
```

**Use Pinia store** for shared state:

```typescript
import { defineStore } from "pinia";

export const useTwitterStore = defineStore("extension-twitter", () => {
  const tweets = ref<Tweet[]>([]);
  
  async function fetchTweets() {
    // ...
  }
  
  return { tweets, fetchTweets };
});
```

### 4. Error Handling

**Graceful degradation**:

```typescript
protected async _getSolvedContent(): Promise<Tweet | ErrorState> {
  try {
    return await fetchTweet(this.getRawContent());
  } catch (error) {
    console.error("[Twitter] Failed to fetch tweet:", error);
    return {
      error: true,
      message: "Failed to load tweet. Please try again later.",
    };
  }
}
```

**User-friendly error messages**:

```vue
<template>
  <div v-if="solvedContent.error" class="error">
    {{ solvedContent.message }}
  </div>
  <div v-else class="tweet">
    <!-- Tweet content -->
  </div>
</template>
```

### 5. Documentation

**README.md in extension folder**:

```markdown
# Twitter Extension

## Features
- Display tweets inline
- Fetch tweet threads
- Show tweet metadata

## Configuration
- `apiKey`: Twitter API key
- `baseUrl`: Twitter API base URL

## Usage
1. Install extension
2. Configure API key in settings
3. Create block with resolver "tweet"
```

**TypeScript types**:

```typescript
export interface Tweet {
  /** Tweet ID */
  id: string;
  /** Tweet content */
  text: string;
  /** Author ID */
  author: string;
  /** Creation timestamp */
  createdAt: Date;
}
```

---

## Twitter Extension Example

### Complete Walkthrough

**File structure**:

```
extensions/twitter/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── Extension.ts
    ├── resolver.ts
    ├── schema.ts
    └── components/
        └── ContentTweet.vue
```

**1. Extension.ts**:

```typescript
import type { IExtension } from "@host/business/extension";
import "./resolver";

const Extension: IExtension = {
  async initialize() {
    console.log("[Twitter] Initialized - TweetResolver registered");
  },
  async activate() {
    console.log("[Twitter] Activated");
  },
  async deactivate() {
    console.log("[Twitter] Deactivated");
  },
  async dispose() {
    console.log("[Twitter] Disposed");
  },
};

export default Extension;
```

**2. schema.ts**:

```typescript
import { z } from "zod";

export const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  createdAt: z.coerce.date(),
});

export type Tweet = z.infer<typeof TweetSchema>;
```

**3. resolver.ts**:

```typescript
import { BaseResolver } from "@host/business/info-base/resolver";
import { markRaw } from "vue";
import ContentTweet from "./components/ContentTweet.vue";
import { TweetSchema, type Tweet } from "./schema";

@BaseResolver.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  protected async _getSolvedContent(): Promise<Tweet> {
    const tweetId = await this.getRawContent();
    
    // Mock fetch (replace with actual Twitter API)
    const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_TWITTER_API_KEY}`,
      },
    });
    
    const data = await response.json();
    
    return TweetSchema.parse({
      id: data.data.id,
      text: data.data.text,
      author: data.data.author_id,
      createdAt: data.data.created_at,
    });
  }
}
```

**4. ContentTweet.vue**:

```vue
<script setup lang="ts">
import type { ContentCompProps } from "@host/business/info-base/resolver";
import type { Tweet } from "../schema";

const props = defineProps<ContentCompProps<Tweet>>();
</script>

<template>
  <div class="tweet">
    <div class="tweet-header">
      <strong>@{{ solvedContent.author }}</strong>
      <span class="tweet-date">
        {{ solvedContent.createdAt.toLocaleString() }}
      </span>
    </div>
    <div class="tweet-body">
      {{ solvedContent.text }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.tweet {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
  
  .tweet-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    
    .tweet-date {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  }
  
  .tweet-body {
    line-height: 1.5;
  }
}
</style>
```

### Using the Extension

**Create a tweet block**:

```typescript
import { BlockForm } from "@/business/info-base/block";

const form = new BlockForm({
  content: "1234567890", // Tweet ID
  resolver: "tweet",
  storage: null,
});

const block = await form.create();
```

**Display in UI**:

```vue
<script setup lang="ts">
import { BaseResolver } from "@/business/info-base/resolver";

const block = await Block.get(blockId);
const resolver = BaseResolver.create(block.resolver, block);
const content = await resolver.getSolvedContent();
</script>

<template>
  <component
    :is="resolver.contentComp"
    :resolver="resolver"
    :solved-content="content"
  />
</template>
```

---

## Troubleshooting

### Module Federation Errors

**Error**: `Remote entry not found`

**Solution**: Check registry URL and network tab

```typescript
console.log(CONFIG.value.INKCRE_EXTENSION_REGISTRY_URL);
// Verify URL is accessible
```

**Error**: `Shared module version mismatch`

**Solution**: Ensure peer dependencies match host

```json
// Extension package.json
"peerDependencies": {
  "vue": "^3.5.0" // Must match host's Vue version
}
```

**Error**: `Cannot read property of undefined`

**Solution**: Check @host alias resolution

```typescript
// Verify paths in tsconfig.json and vite.config.ts
"@host/*": ["../../src/*"]
```

### Resolver Not Found

**Error**: `Unknown resolver type: tweet`

**Solution**: Ensure resolver imported in Extension.ts

```typescript
import "./resolver"; // Side-effect import to trigger decorator
```

### Lifecycle Errors

**Error**: `Cannot call activate on DISCOVERED extension`

**Solution**: Follow state transitions

```typescript
await extension.loadModule();  // DISCOVERED → LOADED
await extension.initialize();  // LOADED → READY
await extension.activate();    // READY → ACTIVE
```

### HMR Issues

**Problem**: Changes not reflecting

**Solution**: Check Vite dev server logs

```bash
# Restart extension dev server
cd extensions/my-extension
pnpm dev
```

---

## References

### Internal Documentation

- [Root Architecture](../ARCHITECTURE.md) - Overall system
- [Business Architecture](../src/business/ARCHITECTURE.md) - Business modules
- [Info-Base Architecture](../src/business/info-base/ARCHITECTURE.md) - Resolver/Storage

### Key Files

- [extension.ts](../src/business/extension.ts) - Extension manager
- [mf-plugins/index.ts](../src/business/mf-plugins/index.ts) - MF runtime
- [resolver.ts](../src/business/info-base/resolver.ts) - Resolver base
- [storage.ts](../src/business/info-base/storage.ts) - Storage base

### Examples

- [Twitter Extension](./twitter/) - Complete reference implementation

### External Documentation

- [Module Federation](https://module-federation.io/) - Architecture guide
- [Vite Plugin](https://github.com/module-federation/vite) - Vite integration
- [Vue 3](https://vuejs.org/) - Vue composition API
- [TypeScript](https://www.typescriptlang.org/) - Type system

---

**Last Updated**: January 2, 2026
