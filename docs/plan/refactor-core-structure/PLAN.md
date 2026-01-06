# Refactoring Plan: packages/core Structure

## Executive Summary

This plan outlines the refactoring of `packages/core` from the current mixed layer/feature architecture to a cleaner domain-driven structure. The refactoring will reorganize ~4,500 lines of code across 41 TypeScript files while preserving all functionality.

**Key Constraints (Expected Behavior):**
- ✅ Vue coupling (Pinia stores, reactive state, Vue Flow integration)
- ✅ Module-level singletons (configStore, authStore, static dbApi instances)
- ✅ Mixed domain objects with data access (Active Record pattern)

## Target Structure

```
packages/core/src/
├── base/
│   └── db-api.ts           # Centralized API clients (DBAPIClient, CoreAPIClient, APIError)
├── extension/              # Extension system (Module Federation, lifecycle)
│   ├── extension.ts        # IExtension protocol, ExtensionState
│   ├── model.ts            # Extension class with Active Record pattern
│   ├── module-federation.ts # MF abstraction layer
│   └── index.ts            # Exports
├── client/                 # Client peer management
│   ├── client.ts           # Client model (Active Record)
│   └── index.ts            # Exports
├── obsrc/                  # Observable sources (data collection)
│   ├── source.ts           # Source model (Active Record)
│   ├── source-type.ts      # SourceType model
│   ├── collect-job.ts      # SourceCollectJob model
│   ├── collect-at.ts       # CollectAt scheduling
│   └── index.ts            # Exports
├── source/                 # (Reserved for future use or merge with obsrc)
│   └── index.ts
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
│   └── ai/                 # AI provider integration (future)
│       └── index.ts        # Placeholder
├── models/                 # (Legacy - for backwards compatibility)
│   ├── log.ts              # Log model (Active Record)
│   └── index.ts            # Re-exports from new locations
├── store.ts                # Pinia singleton (root level)
└── index.ts                # Main entry point
```

## Current vs Target Mapping

| Current Path | Target Path | Notes |
|--------------|-------------|-------|
| `src/api/index.ts` | `src/base/db-api.ts` | Rename and relocate API clients |
| `src/auth/index.ts` | `src/auth/store.ts` | Rename file for clarity |
| `src/config/*` | `src/config/*` | Keep structure, update imports |
| `src/extension/*` | `src/extension/*` | Keep structure, update imports |
| `src/models/block.ts` | `src/info-base/block.ts` | Move to info-base domain |
| `src/models/relation.ts` | `src/info-base/relation.ts` | Move to info-base domain |
| `src/models/storage.ts` | `src/info-base/storage-model.ts` | Move and rename |
| `src/models/client.ts` | `src/client/client.ts` | Move to dedicated client domain |
| `src/models/source.ts` | `src/obsrc/` | Split into 4 files (source, type, job, schedule) |
| `src/models/log.ts` | `src/models/log.ts` | Keep for now (observability domain) |
| `src/info-base/storages/*` | `src/info-base/storages/*` | Keep structure |
| `src/info-base/resolvers/*` | `src/info-base/resolvers/*` | Keep structure |
| `src/sinks/*` | `src/sink/*` | Rename directory (singular) |
| `src/utils/vue-props.ts` | `src/utils/vue-props.ts` | Keep |
| `src/base.ts` | `src/utils/zinstance.ts` | Move and rename |
| `src/store.ts` | `src/store.ts` | Keep at root |
| (new) | `src/libs/ai/index.ts` | Create placeholder |
| (new) | `src/source/index.ts` | Create placeholder |

## Detailed Refactoring Steps

### Phase 1: Setup & Preparation

**Step 1.1: Create new directory structure**
```bash
mkdir -p packages/core/src/base
mkdir -p packages/core/src/client
mkdir -p packages/core/src/obsrc
mkdir -p packages/core/src/source
mkdir -p packages/core/src/libs/ai
mkdir -p packages/core/src/sink/graph
# info-base/storages, info-base/resolvers already exist
```

**Step 1.2: Create placeholder files for new domains**
- `src/libs/ai/index.ts` - Export placeholder for future AI integration
- `src/source/index.ts` - Export placeholder (or merge with obsrc later)

### Phase 2: Move Utility Files (No Dependencies)

**Step 2.1: Move base.ts → utils/zinstance.ts**
- Move `src/base.ts` → `src/utils/zinstance.ts`
- Update imports across the codebase:
  - `models/source.ts` imports `zinstance`
  - Update `src/index.ts` exports

**Step 2.2: Create utils/index.ts**
- Export `zinstance` from `utils/zinstance.ts`
- Export `vue-props.ts` utilities

### Phase 3: Move API Layer (Foundation)

**Step 3.1: Move api/index.ts → base/db-api.ts**
- Move `src/api/index.ts` → `src/base/db-api.ts`
- Update imports across codebase:
  - All model files import `DBAPIClient`
  - Extension model imports both clients
  - Update `src/index.ts` exports

**Step 3.2: Create base/index.ts**
- Export `APIError`, `CoreAPIClient`, `DBAPIClient`

### Phase 4: Reorganize Auth & Config (Keep Structure)

**Step 4.1: Rename auth/index.ts → auth/store.ts**
- Move `src/auth/index.ts` → `src/auth/store.ts`
- Update `src/auth/index.ts` to re-export from `store.ts`
- Update imports (should be minimal, most use named imports)

**Step 4.2: Update config imports**
- Verify all config files remain in `src/config/`
- Update any broken imports from API layer move

### Phase 5: Move Client Domain

**Step 5.1: Move models/client.ts → client/client.ts**
- Move `src/models/client.ts` → `src/client/client.ts`
- Update imports:
  - Extension model imports Client (circular dependency)
  - Update `src/models/index.ts` re-export
  - Update `src/index.ts` exports

**Step 5.2: Create client/index.ts**
- Export `Client`, `CreateClientForm`

### Phase 6: Split Source Domain into obsrc/

**Step 6.1: Split models/source.ts into 4 files**

Create `src/obsrc/collect-at.ts`:
```typescript
// Extract CollectAt class
export class CollectAt {
  // ... existing code
}
```

Create `src/obsrc/source-type.ts`:
```typescript
// Extract SourceType class
import { DBAPIClient } from '../base/db-api'

export class SourceType {
  static dbApi: DBAPIClient | null = null
  // ... existing code
}
```

Create `src/obsrc/collect-job.ts`:
```typescript
// Extract SourceCollectJob class
import { DBAPIClient } from '../base/db-api'
import type { Source } from './source'

export class SourceCollectJob {
  static dbApi: DBAPIClient | null = null
  // ... existing code
}
```

Create `src/obsrc/source.ts`:
```typescript
// Main Source class
import { DBAPIClient } from '../base/db-api'
import { CollectAt } from './collect-at'
import { SourceType } from './source-type'

export class Source {
  static dbApi: DBAPIClient | null = null
  collectAt?: CollectAt
  sourceType?: SourceType
  // ... existing code
}
```

**Step 6.2: Create obsrc/index.ts**
```typescript
export * from './collect-at'
export * from './source-type'
export * from './collect-job'
export * from './source'
```

**Step 6.3: Update imports**
- Update `src/models/index.ts` to re-export from obsrc
- Update any direct imports of Source classes

### Phase 7: Move Info-Base Models

**Step 7.1: Move models/block.ts → info-base/block.ts**
- Move `src/models/block.ts` → `src/info-base/block.ts`
- Update imports:
  - `info-base/resolvers/base.ts` dynamically imports Block
  - `sinks/graph/graph-types.ts` imports Block
  - Update `src/models/index.ts` re-export
  - Update `src/info-base/index.ts` export

**Step 7.2: Move models/relation.ts → info-base/relation.ts**
- Move `src/models/relation.ts` → `src/info-base/relation.ts`
- Update imports:
  - `info-base/resolvers/base.ts` dynamically imports Relation
  - `sinks/graph/graph-types.ts` imports Relation
  - Update `src/models/index.ts` re-export
  - Update `src/info-base/index.ts` export

**Step 7.3: Move models/storage.ts → info-base/storage-model.ts**
- Move `src/models/storage.ts` → `src/info-base/storage-model.ts`
- Update imports in `src/models/index.ts` and `src/info-base/index.ts`

**Step 7.4: Update info-base/index.ts**
```typescript
export * from './block'
export * from './relation'
export * from './storage-model'
export * from './resolvers'
export * from './storages'
```

### Phase 8: Rename sinks → sink

**Step 8.1: Rename directory**
```bash
mv packages/core/src/sinks packages/core/src/sink
```

**Step 8.2: Update imports**
- Update `src/index.ts` export path
- Update any consumers of sink exports

### Phase 9: Update models/ for Backwards Compatibility

**Step 9.1: Update models/index.ts**
```typescript
// Re-export from new locations for backwards compatibility
export * from '../info-base/block'
export * from '../info-base/relation'
export * from '../info-base/storage-model'
export * from '../client/client'
export * from '../obsrc'
export * from './log'  // Keep log here for now
```

**Step 9.2: Keep models/log.ts**
- Log is observability domain, keep in models/ for now
- May move to dedicated observability/ domain in future

### Phase 10: Update Main Entry Point

**Step 10.1: Update src/index.ts**
```typescript
// Core singletons
export { store } from './store'

// Base layer
export * from './base'

// Domain modules
export * from './extension'
export * from './client'
export * from './obsrc'
export * from './info-base'
export * from './sink'
export * from './auth'
export * from './config'
export * from './utils'
export * from './libs/ai'

// Backwards compatibility
export * from './models'
```

### Phase 11: Update Extension System

**Step 11.1: Update extension/model.ts imports**
- Import Client from `../client`
- Import API clients from `../base/db-api`
- Import configStore from `../config`

**Step 11.2: Verify extension/index.ts**
- Ensure all extension exports are correct

### Phase 12: Update Resolver & Storage Imports

**Step 12.1: Update info-base/resolvers/base.ts**
- Update dynamic imports:
  ```typescript
  // Before
  const { Block } = await import('../models/block')

  // After
  const { Block } = await import('../block')
  ```

**Step 12.2: Update info-base/storages/base.ts**
- Verify no import changes needed (self-contained)

### Phase 13: Update Sink/Graph Imports

**Step 13.1: Update sink/graph/graph-types.ts**
```typescript
// Update imports
import type { Block } from '../../info-base/block'
import type { Relation } from '../../info-base/relation'
```

### Phase 14: Verification & Testing

**Step 14.1: Build verification**
```bash
cd packages/core
npm run build
# or
pnpm build
```

**Step 14.2: Check for broken imports**
```bash
# Search for old import paths
grep -r "from '../models/block'" packages/core/src/
grep -r "from '../models/relation'" packages/core/src/
grep -r "from '../models/client'" packages/core/src/
grep -r "from '../models/source'" packages/core/src/
grep -r "from '../api'" packages/core/src/
grep -r "from '../sinks'" packages/core/src/
```

**Step 14.3: Verify exports**
- Check that all exports in `src/index.ts` are valid
- Ensure backwards compatibility through `models/index.ts`

**Step 14.4: TypeScript type checking**
```bash
npx tsc --noEmit
```

## Dependency Management

### Critical Dependencies to Track

1. **Circular Dependencies (Managed via Dynamic Imports):**
   - Extension ↔ Client: Extension imports Client, keep as is
   - Resolver → Block/Relation: Dynamic imports, update paths only

2. **Singleton Dependencies:**
   - All models depend on `DBAPIClient` from `base/db-api.ts`
   - Extension depends on `configStore` from `config/store.ts`
   - Client depends on `authStore` from `auth/store.ts`
   - API clients depend on `configStore` and `authStore`

3. **Vue Dependencies (Preserved):**
   - `store.ts` exports Pinia singleton
   - `config/store.ts` uses Pinia
   - `auth/store.ts` uses Vue reactivity
   - `extension/model.ts` uses Vue refs
   - `info-base/resolvers/base.ts` uses Vue refs
   - `sink/graph/*` uses Vue Flow types

### Import Update Checklist

For each moved file, update imports in:
- ✅ The moved file itself (relative paths change)
- ✅ Files that import the moved file
- ✅ `src/index.ts` main exports
- ✅ `src/models/index.ts` backwards compatibility exports
- ✅ Domain-specific `index.ts` files

## Risk Assessment

### Low Risk
- ✅ Moving utility files (`base.ts` → `utils/zinstance.ts`)
- ✅ Renaming `sinks` → `sink`
- ✅ Creating placeholder directories (`libs/ai`, `source`)

### Medium Risk
- ⚠️ Moving API layer (`api/index.ts` → `base/db-api.ts`) - affects all models
- ⚠️ Splitting `models/source.ts` - requires careful dependency management
- ⚠️ Moving Block/Relation - dynamic imports need path updates

### High Risk
- 🔴 Extension ↔ Client circular dependency - must preserve import structure
- 🔴 Resolver dynamic imports - must update paths correctly
- 🔴 Backwards compatibility - must maintain `models/index.ts` exports

### Mitigation Strategies

1. **Incremental Approach:** Move files one domain at a time, verify build after each
2. **Backwards Compatibility:** Keep `models/index.ts` re-exporting from new locations
3. **Build Validation:** Run `npm run build` after each phase
4. **Import Search:** Use grep to find all import statements before moving files

## Testing Strategy

### Build Testing
```bash
cd packages/core
pnpm install  # Ensure dependencies are fresh
pnpm build    # Verify TypeScript compilation
```

### Import Verification
```bash
# Search for old import patterns
grep -rn "from '../api'" src/
grep -rn "from '../models/block'" src/
grep -rn "from '../models/relation'" src/
grep -rn "from '../models/client'" src/
grep -rn "from '../models/source'" src/
grep -rn "from '../sinks'" src/

# Should return no results after refactoring
```

### Type Checking
```bash
npx tsc --noEmit --project packages/core/tsconfig.json
```

### Integration Testing
- If the project has tests, run them after refactoring:
  ```bash
  pnpm test
  # or
  npm test
  ```

## Rollback Plan

If critical issues arise:

1. **Git Reset:** Use git to revert to pre-refactoring state
   ```bash
   git checkout develop
   git reset --hard HEAD
   ```

2. **Partial Rollback:** If only specific files are problematic:
   ```bash
   git checkout HEAD -- packages/core/src/[problematic-path]
   ```

3. **Incremental Fix:** Fix import issues one by one using TypeScript errors as guide

## Success Criteria

✅ All files moved to target structure
✅ Zero TypeScript compilation errors
✅ All imports updated correctly
✅ Backwards compatibility maintained via `models/index.ts`
✅ Build succeeds (`pnpm build`)
✅ No broken circular dependencies
✅ All singletons preserved (configStore, authStore, dbApi instances)
✅ Vue integration intact (Pinia, reactive state, Vue Flow)
✅ Active Record pattern preserved (domain + data access mixed)

## Post-Refactoring Tasks

1. **Update Documentation:** Update any architecture docs to reflect new structure
2. **Update Dependent Packages:** Check if other packages in monorepo import from `packages/core`
3. **Consider Future Improvements:**
   - Extract Log model to dedicated `observability/` domain
   - Implement AI provider integration in `libs/ai/`
   - Clarify `source/` vs `obsrc/` distinction
   - Consider separating data access layer (if requirements change)

## Notes

- **Expected Behavior Preserved:**
  - Vue coupling maintained (Pinia, refs, Vue Flow)
  - Singletons maintained (configStore, authStore, static dbApi)
  - Active Record pattern maintained (mixed domain + data access)

- **Philosophy:**
  - Domain-driven organization over layer-based
  - Clear boundaries between features (extension, client, info-base, obsrc)
  - Backwards compatibility during transition
  - Preserve existing architectural patterns (not a re-architecture)

- **Timeline:**
  - Estimated: 2-4 hours for careful execution
  - Can be done incrementally (phase by phase)
  - Build verification after each phase recommended
