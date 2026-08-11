# @inkcre/core AGENTS.md

Shared logic package for InKCre applications and extensions.

## Exports Overview

- `auth` - Authentication store
- `base` - DBAPIClient, APIError
- `config` - Configuration adapters & schema
- `database` - Supabase-generated relation types and environment-neutral peer protocol/JWT contract
- `extension` - Extension lifecycle, Module Federation
- `info-base` - Block, Relation, Storage, Resolvers
- `organization` - Organization capability facade
- `obsrv` - Observability (Log)
- `peer` - Peer Active Record, discovery, protocols, and exact capability delegation
- `semantic-retrieval` - Semantic retrieval capability facade
- `sink/graph` - Graph layouts & algorithms
- `source` - Source and Source runtime integration
- `job` / `cron` - global asynchronous work and schedule models
- `utils` - Vue prop helpers

## Key Patterns

### ActiveRecord Pattern

Zod schema + TypeScript class + DB API client:

```typescript
// Schema defines shape
const SourceSchema = z.object({ ... })
// Class provides methods
class Source extends ZodClass { static api = DBAPIClient }
```

### Coupled with Vue

Make use of Vue reactivity thorughout-ly.

### Info-Base Content Contract

- `Block.content` is inline text when `storage === null`; otherwise it is an opaque pointer.
- Consumers call `Block.getHydratedContent({ refresh })` and receive `string | Uint8Array`.
  The non-enumerable cache belongs to that block instance and never replaces the persisted
  pointer.
- Storage handlers own pointer/byte mechanics only. `http` is bounded read-only bytes;
  `postgresql_binary` provides peer-local byte C/R/U/D through PostgREST.
- Resolver selection is exact. The nine shared `core.<kind>.v1` IDs are registered explicitly;
  unknown ID, unsupported capability, supported-null, and authored-empty remain distinct.
- `refresh` replaces a local snapshot; `materializeMissing` only permits an absent derivation.
  Do not add `force` or `reload` aliases.
- Object URLs and browser handles are resolver-private runtime state and must be revoked on
  refresh, dispose, and cache eviction.

## Directory Structure

```
src/
├── auth/           # Authentication
├── base/           # API clients
├── config/         # Configuration
├── extension/      # Extensions
├── info-base/      # Block, Relation, Storage, Resolver
├── libs/           # Third-party (AI)
├── obsrv/          # Logging
├── organization/   # Organization capability facade
├── peer/           # Peer discovery and delegation
├── semantic-retrieval/ # Semantic retrieval capability facade
├── sink/           # Output (graph layouts)
├── source/         # Data collection
├── utils/          # Prop helpers
└── index.ts        # Exports
```

## Commands

```bash
pnpm build        # Build ESM output and declarations with tsdown
pnpm type-check   # Required TypeScript 5.9 check
```

Run `pnpm format`, `pnpm lint`, `pnpm lint:type-aware`, and `pnpm type-check:ts7` from the
repository root.

## Source and Distribution Contract

- Package consumers resolve `dist/index.js` and `dist/index.d.ts`.
- Monorepo Vite and WXT applications alias `@inkcre/core` to `src/index.ts` for source-first
  development.
- The package is ESM-only. Do not add a CommonJS export without a named consumer and an explicit
  contract change.
- Shipped core runtime source and output must not contain an environment profile, service origin,
  or Peer identity. `database.generated.ts` is owned by pinned Supabase CLI type generation from
  core-py's raw schema artifact. `generated.ts` is the stable type adapter.
  `runtime-contract.generated.json` preserves upstream evidence while `runtime-contract.ts`
  projects only protocol and JWT claim metadata; tests may use explicit non-production fixtures.
