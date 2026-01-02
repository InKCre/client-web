# Business Module Architecture

## Table of Contents

- Overview
- BusinessClass Pattern
- API Client Architecture
- Business Domains
- Data Models
- Registry Pattern
- Patterns & Best Practices

---

## Overview

The **business module layer** serves as the core data and logic layer, implementing type-safe data models with runtime validation, API abstractions for database and REST operations, domain-specific business logic, and extensible registry systems.

### Responsibilities

- Define data models and relationships
- Handle API communication (PostgREST + REST)
- Implement business rules and workflows
- Manage lifecycle operations (CRUD, state transitions)
- Provide extension points via registries

### Module Boundaries

```
┌─────────────────────────────────────────┐
│  UI Layer (Components/Views)            │
├─────────────────────────────────────────┤
│  Business Module Layer                  │
│  ┌───────────┬────────────┬──────────┐ │
│  │ Info-Base │  Source    │Extension │ │
│  │ (Block,   │  (Collect  │ System)  │ │
│  │ Relation) │  Jobs)     │          │ │
│  └───────────┴────────────┴──────────┘ │
├─────────────────────────────────────────┤
│  API Layer (DBAPIClient, CoreAPIClient) │
├─────────────────────────────────────────┤
│  Backend (PostgREST, Core API, Storage) │
└─────────────────────────────────────────┘
```

---

## BusinessClass Pattern

### Foundation

All business entities extend a schema-based class combining Zod schemas for validation, TypeScript classes for methods, and runtime type checking.

### Pattern Structure

- **Ref types**: Type-safe foreign key references
- **BusinessClass**: Main entity class with schema, static API clients, query methods, and instance mutations
- **Form classes**: Separate validation for creation contexts

### Key Benefits

1. **Single Source of Truth**: Schema defines types AND validation
2. **Runtime Safety**: Invalid data throws at construction
3. **Clean API**: Static methods for queries, instance methods for mutations
4. **Separation**: Form classes enforce different validation contexts
5. **Testability**: Pure functions, mockable clients

---

## API Client Architecture

InKCre uses a dual API system to separate concerns between direct database access and backend business logic.

### DBAPIClient (PostgREST)

**Purpose**: Direct database access for CRUD operations

**Technology**: Supabase PostgREST client

**Use Cases**:

- Simple CRUD operations
- Queries with filtering, sorting, pagination
- Relational queries with joins
- Real-time subscriptions (future)

### CoreAPIClient (REST)

**Purpose**: Backend business logic and workflows

**Technology**: Custom fetch wrapper with retry logic

**Use Cases**:

- Complex workflows (e.g., collection jobs)
- Backend-exclusive operations
- File uploads
- Server-side processing

### Key Differences

| Aspect | DBAPIClient | CoreAPIClient |
|--------|-------------|---------------|
| **Data Access** | Direct database queries | Backend orchestration |
| **Operations** | CRUD, filtering, joins | Workflows, uploads |
| **Performance** | Faster for simple ops | Required for complex logic |
| **Authentication** | Shared auth store | Shared auth store |
| **Error Handling** | Database errors | API errors with retry |

### When to Use Which Client?

| Scenario | Client | Reason |
|----------|--------|--------|
| Simple CRUD | DBAPIClient | Direct access, faster |
| Complex queries | DBAPIClient | PostgREST query language |
| Workflows | CoreAPIClient | Backend orchestration |
| File uploads | CoreAPIClient | Multipart support |
| Real-time | DBAPIClient | Future subscriptions |
| Batch operations | DBAPIClient | Single transaction |
| Server-side logic | CoreAPIClient | Backend processing |

---

## Business Domains

### Domain Map

```
info-base/
├─ block.ts         # Knowledge graph nodes
├─ relation.ts      # Knowledge graph edges
├─ storage.ts       # Content storage abstraction
├─ resolver.ts      # Content type handlers
├─ graph/           # Graph algorithms

source.ts           # Data collection sources
obsrv.ts            # Observability (logs)
extension.ts        # Extension management
client.ts           # Client management
```

### Domain Relationships

```
┌───────────────────────────────────────────────────┐
│                   Extension                        │
│  (manages plugins, lifecycle, registration)       │
└───────────────┬───────────────────────────────────┘
                │ extends
                ↓
┌───────────────────────────────────────────────────┐
│              Info-Base Domain                      │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐  │
│  │  Block  │───→│ Storage  │    │  Resolver   │  │
│  │ (nodes) │    │(content) │    │(display)    │  │
│  └────┬────┘    └──────────┘    └─────────────┘  │
│       │                                            │
│       ↓                                            │
│  ┌─────────┐                                       │
│  │Relation │                                       │
│  │ (edges) │                                       │
│  └─────────┘                                       │
└───────────────────────────────────────────────────┘
                │ sources
                ↓
┌───────────────────────────────────────────────────┐
│              Source Domain                         │
│  ┌─────────┐         ┌───────────────────┐        │
│  │ Source  │────1:N─→│SourceCollectJob   │        │
│  │         │         │                    │        │
│  └─────────┘         └──────────┬─────────┘        │
│                                 │ logs               │
│                                 ↓                   │
│                      ┌──────────────────┐          │
│                      │   Log (obsrv)    │          │
│                      └──────────────────┘          │
└───────────────────────────────────────────────────┘
                │ used by
                ↓
┌───────────────────────────────────────────────────┐
│              Client Domain                         │
│  ┌─────────┐                                       │
│  │ Client  │ (multi-tenant, extension enablement) │
│  └─────────┘                                       │
└───────────────────────────────────────────────────┘
```

### Key Relationships

- **Block → Storage**: Optional content storage
- **Block → Resolver**: Content type handler
- **Relation → Block**: Graph edges between nodes
- **Source → SourceCollectJob**: Collection tasks
- **SourceCollectJob → Log**: Execution traces
- **Extension ↔ Client**: Enabled plugins

---

## Data Models

### Ref Types Pattern

Every entity defines a **Ref type** for foreign keys, enabling type-safe references and self-documenting code.

### Relation Modeling

For embedded relations (full objects, not just IDs), use specialized schema types.

### Form Classes

Separate validation contexts for creation vs. updates, excluding server-generated fields during creation.

---

## Registry Pattern

InKCre uses decorator-based registries for pluggable components.

### StorageManager

Abstract base class for content storage backends with decorator registration and factory creation.

### ResolverManager

Abstract base class for content type handlers with registration, factory methods, and content resolution caching.

### Extension Registration

Extensions register types via side-effect imports, enabling dynamic component loading.

---

## Patterns & Best Practices

### 1. Static Methods for Queries

Use static methods on BusinessClass for data retrieval operations.

### 2. Instance Methods for Mutations

Use instance methods for updates, deletions, and domain-specific state changes.

### 3. Lazy Loading Pattern

Cache expensive relations and provide cache invalidation methods.

### 4. Content Resolution Flow

Block → Storage (raw content) → Resolver (processed content) → UI Component

### 5. Error Handling

Implement comprehensive error handling with specific API error types and user-friendly messages.

### 6. Creating New Business Classes

**Checklist**:

1. Define Ref type and Zod schema
2. Extend BusinessClass with schema
3. Add static API clients
4. Implement static query methods
5. Implement instance mutation methods
6. Create Form class for creation context
7. Add prop helpers for Vue components
8. Document in business guidelines

**Template Structure**:

- Ref type definition
- Main BusinessClass with API clients and methods
- Form class for creation context
- Vue prop helpers

---

**Last Updated**: January 2, 2026
