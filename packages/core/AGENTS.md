# @inkcre/core AGENTS.md

Shared logic package for InKCre applications and extensions.

## Exports Overview

- `auth` - Authentication store
- `base` - DBAPIClient, APIError
- `client` - Client model & API
- `config` - Configuration adapters & schema
- `database` - generated relation types and environment-neutral peer protocol/JWT contract
- `extension` - Extension lifecycle, Module Federation
- `info-base` - Block, Relation, Storage, Resolvers
- `obsrv` - Observability (Log)
- `sink/graph` - Graph layouts & algorithms
- `source` - Source, CollectJob, CollectAt
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

## Directory Structure

```
src/
├── auth/           # Authentication
├── base/           # API clients
├── client/         # Client model
├── config/         # Configuration
├── extension/      # Extensions
├── info-base/      # Block, Relation, Storage, Resolver
├── libs/           # Third-party (AI)
├── obsrv/          # Logging
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
  or client identity. `runtime-contract.ts` is generated from the peer contract and contains only
  protocol and JWT claim metadata; tests may use explicit non-production fixtures.
