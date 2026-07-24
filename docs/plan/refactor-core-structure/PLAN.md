# Refactoring Plan: packages/core Structure - Ruthless Evolution

> Historical implementation plan. Its Prettier, ESLint, and package-script examples describe the
> repository state when the plan was written; the current executable toolchain contract is owned by
> the root `package.json`, `.oxfmtrc.json`, `.oxlintrc.json`, and the active developer-experience
> packet.

## Executive Summary

This plan outlines a **complete evolution** of `packages/core` from the current mixed layer/feature architecture to a clean domain-driven structure. The refactoring will reorganize ~4,500 lines of code across 41 TypeScript files with **zero backwards compatibility** - a ruthless, bold refactoring for complete modernization.

**Key Constraints (Expected Behavior):**

- ✅ Vue coupling (Pinia stores, reactive state, Vue Flow integration)
- ✅ Module-level singletons (configStore, authStore, static dbApi instances)
- ✅ Mixed domain objects with data access (Active Record pattern)

**Breaking Changes:**

- ❌ **NO backwards compatibility** - all old import paths will break
- 🔄 **Consolidate API clients** - merge CoreAPIClient into DBAPIClient
- 📦 **Complete reorganization** - models/ directory will be deleted
- 🧹 **Code quality enforcement** - Prettier + ESLint for automated verification

## Target Structure

```
packages/core/src/
├── base/
│   └── db-api.ts           # Unified API client (DBAPIClient consolidated with CoreAPIClient)
├── extension/              # Extension system (Module Federation, lifecycle)
│   ├── extension.ts        # IExtension protocol, ExtensionState
│   ├── model.ts            # Extension class with Active Record pattern
│   ├── module-federation.ts # MF abstraction layer
│   └── index.ts            # Exports
├── client/                 # Client peer management
│   ├── client.ts           # Client model (Active Record)
│   └── index.ts            # Exports
├── source/                 # Data collection sources
│   ├── source.ts           # Source model (Active Record)
│   ├── source-type.ts      # SourceType model
│   ├── collect-job.ts      # SourceCollectJob model
│   ├── collect-at.ts       # CollectAt scheduling
│   └── index.ts            # Exports
├── obsrv/                  # Observability (o11y)
│   ├── log.ts              # Log model (Active Record)
│   └── index.ts            # Exports
├── info-base/              # Information base (blocks, relations, content)
│   ├── storages/           # Content storage handlers
│   │   ├── base.ts         # Storage base class + registry
│   │   ├── http.ts         # HTTP storage implementations
│   │   └── index.ts        # Exports
│   ├── resolvers/          # Content resolvers
│   │   ├── base.ts         # Resolver base class + registry
│   │   ├── text.ts         # Text resolver
│   │   ├── image.ts        # Image resolver
│   │   ├── video.ts        # Video resolver
│   │   ├── html.ts         # HTML resolver
│   │   └── index.ts        # Exports
│   ├── block.ts            # Block model (Active Record)
│   ├── relation.ts         # Relation model (Active Record)
│   ├── storage-model.ts    # Storage DB bridge model
│   └── index.ts            # Exports
├── sink/                   # Output formatters
│   ├── graph/              # Graph visualization
│   │   ├── graph-types.ts  # Vue Flow integration
│   │   ├── layout-types.ts # Layout algorithms
│   │   ├── topology-types.ts
│   │   ├── distance-matrix.ts
│   │   ├── mds.ts
│   │   ├── community-types.ts
│   │   └── index.ts        # Exports
│   └── index.ts            # Exports
├── auth/                   # Authentication (JWT)
│   ├── store.ts            # Auth store (singleton)
│   └── index.ts            # Exports
├── config/                 # Configuration management
│   ├── adapters.ts         # Config adapters (localStorage, http, dev, webext)
│   ├── schema.ts           # Zod schemas
│   ├── store.ts            # Config store (singleton)
│   ├── types.ts            # TypeScript types
│   └── index.ts            # Exports
├── utils/                  # Utilities
│   ├── vue-props.ts        # Vue prop helpers
│   ├── zinstance.ts        # Zod instance helper
│   └── index.ts            # Exports
├── libs/
│   └── ai/                 # AI provider integration (placeholder)
│       └── index.ts        # Placeholder exports
├── store.ts                # Pinia singleton (root level)
├── index.ts                # Main entry point
├── .prettierrc             # Prettier configuration
└── .eslintrc.js            # ESLint configuration
```

## Current vs Target Mapping

| Current Path                | Target Path                      | Notes                                            |
| --------------------------- | -------------------------------- | ------------------------------------------------ |
| `src/api/index.ts`          | `src/base/db-api.ts`             | **CONSOLIDATE** CoreAPIClient into DBAPIClient   |
| `src/auth/index.ts`         | `src/auth/store.ts`              | Rename file for clarity                          |
| `src/config/*`              | `src/config/*`                   | Keep structure, update imports                   |
| `src/extension/*`           | `src/extension/*`                | Keep structure, update imports                   |
| `src/models/block.ts`       | `src/info-base/block.ts`         | Move to info-base domain                         |
| `src/models/relation.ts`    | `src/info-base/relation.ts`      | Move to info-base domain                         |
| `src/models/storage.ts`     | `src/info-base/storage-model.ts` | Move and rename                                  |
| `src/models/client.ts`      | `src/client/client.ts`           | Move to dedicated client domain                  |
| `src/models/source.ts`      | `src/source/`                    | Split into 4 files (source, type, job, schedule) |
| `src/models/log.ts`         | `src/obsrv/log.ts`               | Move to observability domain                     |
| `src/info-base/storages/*`  | `src/info-base/storages/*`       | Keep structure                                   |
| `src/info-base/resolvers/*` | `src/info-base/resolvers/*`      | Keep structure                                   |
| `src/sinks/*`               | `src/sink/*`                     | Rename directory (singular)                      |
| `src/utils/vue-props.ts`    | `src/utils/vue-props.ts`         | Keep                                             |
| `src/base.ts`               | `src/utils/zinstance.ts`         | Move and rename                                  |
| `src/store.ts`              | `src/store.ts`                   | Keep at root                                     |
| (new)                       | `src/libs/ai/index.ts`           | Create placeholder                               |
| `src/models/`               | **DELETE**                       | ❌ **NO BACKWARDS COMPATIBILITY**                |
| `src/api/`                  | **DELETE**                       | Replaced by `src/base/`                          |

## Detailed Refactoring Steps

### Phase 0: Code Quality Setup

**Step 0.1: Add Prettier configuration**

Create `packages/core/.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

**Step 0.2: Add ESLint configuration**

Create `packages/core/.eslintrc.js`:

```javascript
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
  },
}
```

**Step 0.3: Update package.json scripts**

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "verify": "npm run format:check && npm run lint && npm run build"
  }
}
```

**Step 0.4: Install dev dependencies**

```bash
cd packages/core
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier prettier
```

### Phase 1: Setup & Preparation

**Step 1.1: Create new directory structure**

```bash
mkdir -p packages/core/src/base
mkdir -p packages/core/src/client
mkdir -p packages/core/src/source
mkdir -p packages/core/src/obsrv
mkdir -p packages/core/src/libs/ai
mkdir -p packages/core/src/sink/graph
# info-base/storages, info-base/resolvers already exist
```

**Step 1.2: Create placeholder files**

Create `src/libs/ai/index.ts`:

```typescript
// Placeholder for future AI provider integration
// TODO: Implement AI provider abstraction layer
export {}
```

### Phase 2: Consolidate & Move Base Layer (API Clients)

**Step 2.1: Read and analyze current API clients**

- Read `src/api/index.ts` to understand both clients
- Identify overlap between `CoreAPIClient` and `DBAPIClient`
- Plan consolidation strategy

**Step 2.2: Create unified DBAPIClient in base/db-api.ts**

Consolidation strategy:

- Merge `CoreAPIClient` functionality into `DBAPIClient`
- Keep PostgREST methods from `DBAPIClient`
- Add custom endpoint methods from `CoreAPIClient`
- Single unified client with both capabilities

Create `src/base/db-api.ts`:

```typescript
import { PostgrestClient } from '@supabase/postgrest-js'
import { watch } from 'vue'
import { configStore } from '../config/store'
import { authStore } from '../auth/store'

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Unified API client with both PostgREST and custom endpoint capabilities
export class DBAPIClient extends PostgrestClient {
  private baseURL: string
  private headers: Record<string, string> = {}

  constructor(url?: string, options?: any) {
    const baseURL = url || configStore.app.CORE_API_URL
    super(baseURL, options)
    this.baseURL = baseURL

    // Watch for config changes
    watch(
      () => configStore.app.CORE_API_URL,
      (newURL) => {
        this.baseURL = newURL
        this.url = new URL(newURL)
      }
    )

    // Watch for auth token changes
    watch(
      () => authStore.token,
      (token) => {
        if (token) {
          this.headers['Authorization'] = `Bearer ${token}`
        } else {
          delete this.headers['Authorization']
        }
      },
      { immediate: true }
    )
  }

  // Custom endpoint methods (from CoreAPIClient)
  async request<T = any>(
    method: string,
    path: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${path}`
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new APIError(error.message || 'Request failed', response.status, error)
    }

    return response.json()
  }

  // Convenience methods
  async get<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, undefined, options)
  }

  async post<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', path, data, options)
  }

  async put<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', path, data, options)
  }

  async patch<T = any>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', path, data, options)
  }

  async delete<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options)
  }
}
```

**Step 2.3: Create base/index.ts**

```typescript
export * from './db-api'
```

### Phase 3: Move Utils (No Dependencies)

**Step 3.1: Move base.ts → utils/zinstance.ts**

```bash
mv packages/core/src/base.ts packages/core/src/utils/zinstance.ts
```

**Step 3.2: Create/update utils/index.ts**

```typescript
export * from './vue-props'
export * from './zinstance'
```

### Phase 4: Move Auth & Config Domains

**Step 4.1: Rename auth/index.ts → auth/store.ts**

```bash
mv packages/core/src/auth/index.ts packages/core/src/auth/store.ts
```

**Step 4.2: Update auth imports in auth/store.ts**

- Update import from `../api` to `../base/db-api`
- Keep all other code the same

**Step 4.3: Create auth/index.ts**

```typescript
export * from './store'
```

**Step 4.4: Update config domain**

- Verify all config files have correct imports
- Update any imports from `../api` to `../base/db-api` if present

**Step 4.5: Create config/index.ts (if not exists)**

```typescript
export * from './adapters'
export * from './schema'
export * from './store'
export * from './types'
```

### Phase 5: Move Client Domain

**Step 5.1: Move models/client.ts → client/client.ts**

```bash
mv packages/core/src/models/client.ts packages/core/src/client/client.ts
```

**Step 5.2: Update client/client.ts imports**

```typescript
// Update imports
import { DBAPIClient } from '../base/db-api' // was '../api'
import { authStore } from '../auth/store' // was '../auth'
```

**Step 5.3: Create client/index.ts**

```typescript
export * from './client'
```

### Phase 6: Move Source Domain

**Step 6.1: Read models/source.ts to understand structure**

**Step 6.2: Split models/source.ts into 4 files**

Create `src/source/collect-at.ts`:

```typescript
import dayjs, { type Dayjs } from 'dayjs'

export class CollectAt {
  // Extract CollectAt class from models/source.ts
  // ... copy implementation
}
```

Create `src/source/source-type.ts`:

```typescript
import { DBAPIClient } from '../base/db-api'

export class SourceType {
  static dbApi: DBAPIClient | null = null
  // ... copy implementation
}
```

Create `src/source/collect-job.ts`:

```typescript
import { DBAPIClient } from '../base/db-api'
import type { Source } from './source'

export class SourceCollectJob {
  static dbApi: DBAPIClient | null = null
  // ... copy implementation
}
```

Create `src/source/source.ts`:

```typescript
import { DBAPIClient } from '../base/db-api'
import { zinstance } from '../utils/zinstance' // was '../base'
import { CollectAt } from './collect-at'
import { SourceType } from './source-type'

export class Source {
  static dbApi: DBAPIClient | null = null
  collectAt?: CollectAt
  sourceType?: SourceType
  // ... copy implementation
}
```

**Step 6.3: Create source/index.ts**

```typescript
export * from './collect-at'
export * from './source-type'
export * from './collect-job'
export * from './source'
```

### Phase 7: Move Observability Domain

**Step 7.1: Create obsrv directory and move log**

```bash
mkdir -p packages/core/src/obsrv
mv packages/core/src/models/log.ts packages/core/src/obsrv/log.ts
```

**Step 7.2: Update obsrv/log.ts imports**

```typescript
import { DBAPIClient } from '../base/db-api' // was '../api'
```

**Step 7.3: Create obsrv/index.ts**

```typescript
export * from './log'
```

### Phase 8: Move Info-Base Domain

**Step 8.1: Move models/block.ts → info-base/block.ts**

```bash
mv packages/core/src/models/block.ts packages/core/src/info-base/block.ts
```

**Step 8.2: Update info-base/block.ts imports**

```typescript
import { DBAPIClient } from '../base/db-api' // was '../api'
import { makeObjectProp, makeStringProp, makeNumberProp } from '../utils/vue-props' // was '../utils/vue-props'
```

**Step 8.3: Move models/relation.ts → info-base/relation.ts**

```bash
mv packages/core/src/models/relation.ts packages/core/src/info-base/relation.ts
```

**Step 8.4: Update info-base/relation.ts imports**

```typescript
import { DBAPIClient } from '../base/db-api' // was '../api'
import type { Block } from './block' // was './block'
```

**Step 8.5: Move models/storage.ts → info-base/storage-model.ts**

```bash
mv packages/core/src/models/storage.ts packages/core/src/info-base/storage-model.ts
```

**Step 8.6: Update info-base/storage-model.ts imports**

```typescript
import { DBAPIClient } from '../base/db-api' // was '../api'
import { Storage } from './storages/base' // was '../info-base/storages/base'
```

**Step 8.7: Update info-base/resolvers/base.ts**

```typescript
// Update dynamic imports
const { Block } = await import('../block') // was '../../models/block'
const { Relation } = await import('../relation') // was '../../models/relation'
```

**Step 8.8: Update info-base/index.ts**

```typescript
export * from './block'
export * from './relation'
export * from './storage-model'
export * from './resolvers'
export * from './storages'
```

### Phase 9: Move Extension Domain

**Step 9.1: Update extension/model.ts imports**

```typescript
import { DBAPIClient } from '../base/db-api' // was '../api'
import { configStore } from '../config/store' // was '../config'
import type { Client } from '../client/client' // was '../models/client'
```

**Step 9.2: Verify extension/index.ts**

```typescript
export * from './extension'
export * from './model'
export * from './module-federation'
```

### Phase 10: Move Sink Domain

**Step 10.1: Rename sinks → sink**

```bash
mv packages/core/src/sinks packages/core/src/sink
```

**Step 10.2: Update sink/graph/graph-types.ts**

```typescript
import type { Block } from '../../info-base/block' // was '../../models/block'
import type { Relation } from '../../info-base/relation' // was '../../models/relation'
```

**Step 10.3: Verify sink/index.ts**

```typescript
export * from './graph'
```

**Step 10.4: Verify sink/graph/index.ts**

```typescript
export * from './graph-types'
export * from './layout-types'
export * from './topology-types'
export * from './distance-matrix'
export * from './mds'
export * from './community-types'
```

### Phase 11: Update Main Entry Point & Cleanup

**Step 11.1: Update src/index.ts**

```typescript
// Core singleton
export { store } from './store'

// Base layer
export * from './base'

// Domain modules
export * from './extension'
export * from './client'
export * from './source'
export * from './obsrv'
export * from './info-base'
export * from './sink'
export * from './auth'
export * from './config'
export * from './utils'
export * from './libs/ai'
```

**Step 11.2: Delete old directories**

```bash
rm -rf packages/core/src/models
rm -rf packages/core/src/api
```

### Phase 12: Code Quality Verification

**Step 12.1: Run Prettier**

```bash
cd packages/core
pnpm format
```

**Step 12.2: Run ESLint**

```bash
pnpm lint:fix
```

**Step 12.3: Manual fixes for ESLint issues**

- Fix any ESLint errors that auto-fix couldn't handle
- Review warnings and fix critical ones

### Phase 13: Build & Type Verification

**Step 13.1: TypeScript type checking**

```bash
cd packages/core
npx tsc --noEmit
```

**Step 13.2: Build verification**

```bash
pnpm build
```

**Step 13.3: Search for broken imports**

```bash
# Search for old import patterns (should return nothing)
grep -rn "from '../models" src/ || echo "✓ No old models imports"
grep -rn "from '../api'" src/ || echo "✓ No old api imports"
grep -rn "from '../sinks" src/ || echo "✓ No old sinks imports"
grep -rn "from '.*base'" src/ | grep -v "from '../base" || echo "✓ No old base imports"
```

### Phase 14: Final Verification

**Step 14.1: Run complete verification**

```bash
pnpm verify  # Runs format:check + lint + build
```

**Step 14.2: Test if package exports work**

```bash
# In another package that depends on @inkcre/core
pnpm install
pnpm build
```

## API Client Consolidation Details

### Current State

- **DBAPIClient**: PostgREST client for database operations
- **CoreAPIClient**: Custom HTTP client for Core API endpoints
- Both clients watch configStore and authStore separately

### Consolidated State

- **DBAPIClient (unified)**: Single client extending PostgrestClient
  - Inherits all PostgREST methods (`.from()`, `.rpc()`, etc.)
  - Adds custom endpoint methods (`.get()`, `.post()`, `.request()`, etc.)
  - Single source for config/auth watching
  - Simplified initialization in models

### Migration Guide (for reference)

```typescript
// Before
Extension.dbApi = new DBAPIClient()
Extension.coreApi = new CoreAPIClient()

// After
Extension.dbApi = new DBAPIClient() // Has both capabilities now
```

## Code Quality Enforcement

### Prettier Configuration

- Semi: false (no semicolons)
- Single quotes
- Tab width: 2 spaces
- Trailing commas: ES5
- Print width: 100

### ESLint Rules

- TypeScript recommended rules
- Warn on `any` usage
- Error on unused vars (except `_` prefix)
- Warn on console.log

### Verification Scripts

- `pnpm format` - Auto-format all files
- `pnpm lint` - Check for lint errors
- `pnpm lint:fix` - Auto-fix lint errors
- `pnpm verify` - Complete verification pipeline

## Risk Assessment

### High Impact Changes

- 🔴 **API client consolidation** - affects all models
- 🔴 **No backwards compatibility** - breaking change for consumers
- 🔴 **Directory deletions** - models/ and api/ completely removed

### Medium Risk

- ⚠️ **Source splitting** - 1 file → 4 files requires careful dependency management
- ⚠️ **Dynamic imports** - resolver paths must be updated correctly
- ⚠️ **Extension ↔ Client** - circular dependency must be preserved

### Mitigation

1. **Incremental execution** - one phase at a time
2. **Build verification** - after each major phase
3. **Automated verification** - Prettier + ESLint + TypeScript
4. **Import search** - grep for old patterns before completion

## Success Criteria

✅ All files moved to target structure
✅ Zero TypeScript compilation errors
✅ Zero ESLint errors
✅ All code formatted with Prettier
✅ Build succeeds (`pnpm build`)
✅ No old import patterns found
✅ `models/` directory deleted
✅ `api/` directory deleted
✅ CoreAPIClient merged into DBAPIClient
✅ All singletons preserved (configStore, authStore, static dbApi)
✅ Vue integration intact (Pinia, reactive state, Vue Flow)
✅ Active Record pattern preserved

## Breaking Changes Notice

⚠️ **BREAKING CHANGES** - All consumers of `@inkcre/core` must update imports:

```typescript
// ❌ OLD (will break)
import { Block } from '@inkcre/core/models'
import { DBAPIClient, CoreAPIClient } from '@inkcre/core/api'

// ✅ NEW
import { Block } from '@inkcre/core/info-base'
import { DBAPIClient } from '@inkcre/core/base'
// CoreAPIClient is now part of DBAPIClient
```

## Post-Refactoring Tasks

1. ✅ **Update all dependent packages** in the monorepo
2. ✅ **Update documentation** to reflect new structure
3. ✅ **Update CI/CD** to run verification scripts
4. ✅ **Create migration guide** for external consumers
5. 🔮 **Future improvements:**
   - Implement AI provider integration in `libs/ai/`
   - Consider separating data access layer (Repository pattern)
   - Add unit tests for each domain

## Notes

- **Philosophy:** Ruthless evolution, zero technical debt preservation
- **Approach:** Domain-driven organization with clear boundaries
- **Quality:** Automated verification via Prettier + ESLint
- **Timeline:** ~3-5 hours for careful execution with verification
