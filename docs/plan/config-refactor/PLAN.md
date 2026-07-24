# Config Refactor Plan: MetaConfig Extraction

## Overview

Refactor `packages/core/src/config` to separate bootstrap/meta configuration from app configuration, enabling clean configuration loading flow:

- MetaConfig (bootstrap): Contains URLs/secrets needed to fetch app config
- AppConfig (runtime): Contains extension registry URL, AI settings, etc.

## Current State

```typescript
AppConfigSchema {
  INKCRE_CORE_URL (deprecated)
  INKCRE_PGREST_URL
  INKCRE_EXTENSION_REGISTRY_URL
  INKCRE_JWT_SECRET
  INKCRE_CLIENT_ID
  INKCRE_API (deprecated)
  llmProviders
  defaultModel
  explainInstruction
}
```

## Proposed Structure

### 1. MetaConfig (New)

- INKCRE_PGREST_URL: PostgreSQL/PostgREST base URL
- INKCRE_JWT_SECRET: JWT signing secret
- INKCRE_CLIENT_ID: Current client UUID
- Purpose: Loaded first, contains bootstrap credentials

### 2. AppConfig (Modified)

- INKCRE_EXTENSION_REGISTRY_URL: Extension registry URL
- llmProviders: LLM provider configurations
- defaultModel: Default LLM model
- explainInstruction: Explain feature instruction
- Purpose: Loaded after meta config, contains runtime app settings

### 3. Removed (Deprecated)

- ✅ INKCRE_CORE_URL: No longer used in codebase
- ✅ INKCRE_API: Only used in client-webext, will be handled separately

## Changes Required

### File Changes

#### 1. `packages/core/src/config/schema.ts`

- Create `MetaConfigSchema` with 3 fields
- Update `AppConfigSchema` to only include app-level config
- Update `ConfigSchema` to merge MetaConfig + AppConfig
- Update type exports
- Update default LLM providers (no change)
- Update DEFAULT_EXPLAIN_INSTRUCTION (no change)

#### 2. `packages/core/src/config/types.ts`

- Export `MetaConfig` type

#### 3. `packages/core/src/config/adapters.ts`

- No changes required (works with merged schema)

#### 4. `packages/core/src/config/store.ts`

- No changes required (works with merged schema)

#### 5. `packages/core/src/config/index.ts`

- Update documentation examples
- Export `MetaConfigSchema`

### Usage Site Updates

#### Core Usage (packages/core/src)

1. auth/store.ts: Uses `INKCRE_JWT_SECRET` ✓ (no change needed)
2. base/db-api.ts: Uses `INKCRE_PGREST_URL` ✓ (no change needed)
3. client/client.ts: Uses `INKCRE_CLIENT_ID` ✓ (no change needed)
4. extension/base.ts: Uses `INKCRE_CLIENT_ID` and `INKCRE_EXTENSION_REGISTRY_URL` ✓ (no change needed)

#### Client-WebExt Usage (apps/client-webext)

1. logic/storage.ts: Uses `llmProviders`, `explainInstruction` ✓ (no change needed)
2. logic/explain/index.ts: Uses `explainInstruction` ✓ (no change needed)
3. logic/explain/chat.ts: Uses `explainInstruction` ✓ (no change needed)
4. entrypoints/options/Options.vue: Uses `llmProviders`, `defaultModel` ✓ (no change needed)

All existing accesses remain valid since `ConfigSchema` merges both schemas.

## Implementation Steps

### Phase 1: Schema Updates

1. Refactor `schema.ts` to create `MetaConfigSchema` and update `AppConfigSchema`
2. Verify `ConfigSchema` merge is correct
3. Update type exports

### Phase 2: Documentation & Exports

1. Update `index.ts` documentation
2. Update `types.ts` exports

### Phase 3: Validation

1. Type checking throughout codebase
2. No runtime changes needed (all accesses already work)

## Benefits

- Clear separation of concerns: Bootstrap vs. runtime config
- Future extensibility: Easy to load app config from server using meta config
- Cleaner migration path: Can load AppConfig from client.config endpoint
- Deprecation: Removes unused `INKCRE_CORE_URL` and `INKCRE_API`

## Files Modified

- `packages/core/src/config/schema.ts` ✏️
- `packages/core/src/config/types.ts` ✏️
- `packages/core/src/config/index.ts` ✏️

## Files Unchanged

- All adapters (work with merged schema)
- All usage sites (no behavioral changes)
- All documentation examples remain valid
