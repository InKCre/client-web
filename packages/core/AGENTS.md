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

### BusinessClass Pattern
Zod schema + TypeScript class + static API clients:
```typescript
// Schema defines shape
const SourceSchema = z.object({ ... })
// Class provides methods
class Source extends ZodClass { static api = DBAPIClient }
```

### Dual API Architecture
- **DBAPIClient**: Direct PostgREST queries (fast CRUD)
- **CoreAPIClient**: REST to core-py (complex logic)

### Registry Pattern
Decorator-based registration for Storage & Resolver:
```typescript
@Resolver.register('text')
class TextResolver extends Resolver { ... }
```

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
