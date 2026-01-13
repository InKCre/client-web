# @inkcre/core AGENTS.md

Shared logic package for InKCre applications and extensions.

## Exports Overview

- `auth` - Authentication store
- `base` - DBAPIClient, APIError
- `client` - Client model & API
- `config` - Configuration adapters & schema
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
pnpm build        # Build with tsup
pnpm type-check   # TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier
```
