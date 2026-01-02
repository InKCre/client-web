# Business Module Architecture

## Table of Contents

- [Overview](#overview)
- [BusinessClass Pattern](#businessclass-pattern)
- [API Client Architecture](#api-client-architecture)
- [Business Domains](#business-domains)
- [Data Models](#data-models)
- [Registry Pattern](#registry-pattern)
- [Patterns & Best Practices](#patterns--best-practices)
- [API Integration](#api-integration)
- [References](#references)

---

## Overview

The **business module layer** (`src/business/`) serves as the core data and logic layer of InKCre client-web. It implements the **Active Record pattern** using Zod-based schema classes, providing:

- **Type-safe data models** with runtime validation
- **API client abstractions** for database and REST operations
- **Domain-specific business logic** encapsulated in classes
- **Extensible registry systems** for pluggable components

### Responsibilities

- Define data models and their relationships
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
│  │ (Block,   │  (Collect  │ (Plugin  │ │
│  │ Relation) │  Jobs)     │ System)  │ │
│  └───────────┴────────────┴──────────┘ │
├─────────────────────────────────────────┤
│  API Layer (DBAPIClient, CoreAPIClient) │
├─────────────────────────────────────────┤
│  Backend (PostgREST, Core API, Storage) │
└─────────────────────────────────────────┘
```

---

## BusinessClass Pattern

### Foundation: Zod-Class

All business entities extend `Z.class` from the `zod-class` library, combining:

- **Zod schemas** for validation
- **TypeScript classes** for methods and logic
- **Runtime type checking** on construction

### Pattern Structure

```typescript
import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "./api";

// 1. Define Ref type for foreign keys
export type UserRef = string;
export const UserRefZ = z.string();

// 2. Vue prop helper
export const makeUserProp = (v?: any) => makeObjectProp<User>(v);

// 3. BusinessClass with schema
class User extends Z.class({
  id: UserRefZ,
  nickname: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date().default(() => new Date()),
}) {
  // 4. Static API clients
  static dbApi: DBAPIClient = new DBAPIClient("users", User);
  static coreApi: CoreAPIClient<User> = new CoreAPIClient("/users", User);

  // 5. Static query methods
  static async get(id: UserRef): Promise<User> {
    return new User((await this.dbApi.from().select().eq("id", id).single()).data!);
  }

  static async getAll(): Promise<User[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new User(d));
  }

  // 6. Instance mutation methods
  public async save(): Promise<User> {
    return User.dbApi.first(await User.dbApi.from().upsert(this).select());
  }

  public async delete(): Promise<void> {
    await User.dbApi.from().delete().eq("id", this.id);
  }

  // 7. Domain-specific methods
  public async sendWelcomeEmail(): Promise<void> {
    await User.coreApi.request({
      method: "POST",
      path: `/${this.id}/welcome`,
    });
  }
}

// 8. Form class for creation
class UserForm extends Z.class({
  ...User.shape,
  id: z.undefined(), // No ID during creation
}) {
  public async create(): Promise<User> {
    return new User((await User.dbApi.from().insert(this).select().single()).data!);
  }
}
```

### Why This Pattern?

1. **Single Source of Truth**: Schema defines TypeScript types AND validation
2. **Runtime Safety**: Invalid data throws at construction time
3. **Clean API**: Static methods for queries, instance methods for mutations
4. **Separation**: Form classes enforce different validation contexts
5. **Testability**: Pure functions, mockable API clients

---

## API Client Architecture

InKCre uses a **dual API system** to separate concerns:

### DBAPIClient (PostgREST)

**Purpose**: Direct database access for CRUD operations

**Technology**: Supabase PostgREST client

**Use Cases**:

- Simple CRUD operations
- Queries with filtering, sorting, pagination
- Relational queries with joins
- Real-time subscriptions (future)

**Implementation** (from `api.ts`):

```typescript
export class DBAPIClient<DT = any> {
  private dbClient: PostgrestClient;
  
  constructor(
    protected table: string,
    protected defResBodySchema?: { parse<DT>(input: unknown): DT }
  ) {
    this.dbClient = new PostgrestClient(CONFIG.value.INKCRE_PGREST_URL, {
      headers: await this.getAuthHeaders(),
    });
    
    // Watch config changes to update base URL
    watch(() => CONFIG.value.INKCRE_PGREST_URL, (newUrl) => {
      this.dbClient = new PostgrestClient(newUrl, {
        headers: await this.getAuthHeaders(),
      });
    });
  }

  // Returns PostgREST query builder
  public from(): PostgrestQueryBuilder<DT> {
    return this.dbClient.from(this.table);
  }

  // Helper to get first result with schema parsing
  public first<T = DT>(response: any): T {
    const data = response.data?.[0];
    return this.defResBodySchema ? this.defResBodySchema.parse(data) : data;
  }
}
```

**Example Usage**:

```typescript
// Query with filters
const recentBlocks = await Block.dbApi
  .from()
  .select()
  .eq("resolver", "text")
  .order("created_at", { ascending: false })
  .limit(10);

// Insert and return
const newBlock = await Block.dbApi
  .from()
  .insert({ content: "Hello", resolver: "text" })
  .select()
  .single();

// Upsert pattern
await Block.dbApi.from().upsert(blockInstance).select();
```

### CoreAPIClient (REST)

**Purpose**: Backend business logic and workflows

**Technology**: Custom fetch wrapper with retry logic

**Use Cases**:

- Complex workflows (e.g., collection jobs)
- Backend-exclusive operations
- File uploads
- Operations requiring server-side processing

**Implementation** (from `api.ts`):

```typescript
export class CoreAPIClient<DT = any> {
  protected baseURL: string;
  static authStore = useAuthStore(stores);

  constructor(
    protected pathPrefix: string = "",
    protected defResBodySchema?: { parse<DT>(input: unknown): DT }
  ) {
    this.baseURL = `${CONFIG.value.INKCRE_CORE_URL}${pathPrefix}`;
  }

  protected async getAuthHeaders(): Promise<object> {
    return {
      Authorization: `Bearer ${await CoreAPIClient.authStore.getToken()}`,
    };
  }

  public async request<T = DT>(options: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, any>;
    resBodySchema?: { parse<T>(input: unknown): T };
  }): Promise<T> {
    const { method, path, body, query, resBodySchema } = options;
    const url = new URL(`${this.baseURL}${path}`);

    // Build request config with auth
    const config: RequestInit = {
      method,
      headers: { ...(await this.getAuthHeaders()) },
    };

    // Handle different body types
    if (body !== undefined) {
      if (isPlainObject(body)) {
        config.body = JSON.stringify(body);
        config.headers = { "Content-Type": "application/json", ...config.headers };
      } else {
        config.body = body; // FormData, Blob, etc.
      }
    }

    // Add query params
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Fetch with 401 retry
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Parse error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const responseData = await response.json();
          errorMessage = responseData.message || responseData.error || errorMessage;
        } catch {}

        // Retry once on 401 with fresh token
        if (response.status === 401) {
          const retryResponse = await fetch(url, {
            ...config,
            headers: { ...(await this.getAuthHeaders()) },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return (resBodySchema || this.defResBodySchema)?.parse(data) || data;
          }
        }

        throw new APIError(errorMessage, response.status, responseData);
      }

      const data = await response.json();
      return (resBodySchema || this.defResBodySchema)?.parse(data) || data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError(`Network error: ${error.message}`, 0);
    }
  }
}
```

**Example Usage**:

```typescript
// Trigger collection job
await Source.coreApi.request({
  method: "POST",
  path: `/${sourceId}/collect`,
  body: { params: { limit: 100 } },
});

// Upload file
const formData = new FormData();
formData.append("file", file);
await Storage.coreApi.request({
  method: "POST",
  path: "/upload",
  body: formData,
});
```

### Authentication Integration

Both API clients share the **same auth store**:

```typescript
import { useAuthStore } from "@/stores/auth";
import stores from "@/stores";

export class CoreAPIClient {
  static authStore = useAuthStore(stores);
  
  protected async getAuthHeaders(): Promise<object> {
    return {
      Authorization: `Bearer ${await CoreAPIClient.authStore.getToken()}`,
    };
  }
}
```

- Token generated using JWT with HS256
- 24-hour expiration
- Auto-refresh on 401 response
- Reactive to config changes

### When to Use Which Client?

| Scenario | Client | Reason |
|----------|--------|--------|
| Simple CRUD | DBAPIClient | Direct database access, faster |
| Complex queries | DBAPIClient | PostgREST query language |
| Workflows | CoreAPIClient | Backend orchestration |
| File uploads | CoreAPIClient | Multipart form data |
| Real-time | DBAPIClient | Future: PostgREST subscriptions |
| Batch operations | DBAPIClient | Single transaction |
| Server-side logic | CoreAPIClient | Backend processing required |

---

## Business Domains

### Domain Map

```
info-base/
├─ block.ts         # Knowledge graph nodes
├─ relation.ts      # Knowledge graph edges
├─ storage.ts       # Content storage abstraction
├─ resolver.ts      # Content type handlers
├─ graph/           # Graph algorithms (community, distance)
└─ resolvers/       # Built-in resolver implementations

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

- **Block → Storage**: Optional foreign key (`storage: number | null`)
- **Block → Resolver**: Type identifier (`resolver: string`)
- **Relation → Block**: Source/target (`source: BlockRef`, `target: BlockRef`)
- **Source → SourceCollectJob**: One-to-many (`source: SourceRef`)
- **SourceCollectJob → Log**: One-to-many via `trace_id`
- **Extension ↔ Client**: Many-to-many (`enabledExtensions: ExtensionRef[]`)

---

## Data Models

### Ref Types Pattern

Every business entity defines a **Ref type** for foreign keys:

```typescript
export type BlockRef = number;
export const BlockRefZ = z.number();
export const makeBlockProp = (v?: any) => makeObjectProp<Block>(v);
export const makeBlockRefProp = (v?: any) => makeNumberProp<BlockRef>(v);
```

**Benefits**:

- Type-safe foreign key references
- Self-documenting code
- Easy prop type generation for Vue components

### Relation Modeling with `zinstance`

For **embedded relations** (not just foreign keys), use `zinstance`:

```typescript
import { zinstance } from "@/business/base";

class Post extends Z.class({
  id: z.number(),
  authorId: UserRefZ,              // Foreign key (just the ID)
  author: zinstance<User>(User),   // Embedded relation (full object)
  content: z.string(),
}) {
  // ...
}

// Usage
const post = await Post.get(1);
console.log(post.author.nickname); // Typed access to User properties
```

**`zinstance` Implementation** (from `base.ts`):

```typescript
export function zinstance<T>(schema: any): z.ZodType<T> {
  return z.instanceof(schema) as z.ZodType<T>;
}
```

### Form Classes

**Purpose**: Separate validation context for creation vs. updates

```typescript
class BlockForm extends Z.class({
  ...Block.shape,
  id: z.undefined(),           // Disallow ID during creation
  created_at: z.undefined(),   // Server-generated
  updated_at: z.undefined(),   // Server-generated
}) {
  public async create(): Promise<Block> {
    return new Block(
      (await Block.dbApi.from().insert(this).select().single()).data!
    );
  }
}

// Usage
const form = new BlockForm({
  content: "New block",
  resolver: "text",
  storage: null,
});
const block = await form.create();
```

---

## Registry Pattern

InKCre uses **decorator-based registries** for extensibility.

### StorageManager

**Purpose**: Pluggable storage backends for block content

**Implementation** (from `storage.ts`):

```typescript
export abstract class Storage extends Z.class({
  id: z.number(),
  type: z.string(),
  config: z.record(z.any()),
}) {
  // Registry map
  private static _types: Map<string, typeof Storage> = new Map();

  // Decorator for registration
  static registry(type: string) {
    return function <T extends typeof Storage>(constructor: T) {
      Storage._types.set(type, constructor);
      return constructor;
    };
  }

  // Factory method
  static create(data: any): Storage {
    const storageClass = Storage._types.get(data.type);
    if (!storageClass) {
      throw new Error(`Unknown storage type: ${data.type}`);
    }
    return new storageClass(data);
  }

  // Abstract method for subclasses
  abstract getRawContent(): Promise<string>;
}

// Built-in storage types
@Storage.registry("url")
export class URLStorage extends Storage {
  async getRawContent(): Promise<string> {
    const response = await fetch(this.config.url);
    return response.text();
  }
}

@Storage.registry("text")
export class TextStorage extends Storage {
  async getRawContent(): Promise<string> {
    return this.config.text;
  }
}

@Storage.registry("blob")
export class BlobStorage extends Storage {
  async getRawContent(): Promise<string> {
    const response = await Storage.coreApi.request({
      method: "GET",
      path: `/blob/${this.config.blobId}`,
    });
    return response;
  }
}
```

### ResolverManager

**Purpose**: Pluggable content type handlers

**Implementation** (from `resolver.ts`):

```typescript
export abstract class BaseResolver<RawContentT = any, SolvedContentT = any> {
  abstract readonly type: string;
  abstract readonly contentComp: Component; // Vue component for display

  // Registry map
  private static _types: Map<string, typeof BaseResolver> = new Map();

  // Decorator for registration
  static registry(type: string) {
    return function <T extends typeof BaseResolver>(constructor: T) {
      BaseResolver._types.set(type, constructor);
      return constructor;
    };
  }

  // Factory method
  static create(type: string, block: Block): BaseResolver {
    const ResolverClass = BaseResolver._types.get(type) || DefaultResolver;
    return new ResolverClass(block);
  }

  // Content resolution with caching
  private _cachedSolvedContent: SolvedContentT | undefined;
  
  public async getSolvedContent(): Promise<SolvedContentT> {
    if (this._cachedSolvedContent !== undefined) {
      return this._cachedSolvedContent;
    }
    this._cachedSolvedContent = await this._getSolvedContent();
    return this._cachedSolvedContent;
  }

  // Abstract method for subclasses
  protected abstract _getSolvedContent(): Promise<SolvedContentT>;
}

// Built-in resolver
@BaseResolver.registry("text")
export class TextResolver extends BaseResolver<string, string> {
  readonly type = "text";
  readonly contentComp = markRaw(ContentText);

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent();
  }
}
```

### Extension Registration

Extensions register their types via **side-effect imports**:

```typescript
// In extension/resolver.ts
import { BaseResolver } from "@host/business/info-base/resolver";
import ContentTweet from "./components/ContentTweet.vue";
import { markRaw } from "vue";

@BaseResolver.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  protected async _getSolvedContent(): Promise<Tweet> {
    const tweetId = this.getRawContent();
    // Fetch tweet data from API
    return fetchTweet(tweetId);
  }
}

// In extension/Extension.ts
import "./resolver"; // Side-effect registration

const Extension: IExtension = {
  async initialize() {
    // TweetResolver is now registered
  },
  // ...
};
```

---

## Patterns & Best Practices

### 1. Static Methods for Queries

```typescript
class Block {
  // Single entity
  static async get(id: BlockRef): Promise<Block> {
    return new Block((await this.dbApi.from().select().eq("id", id).single()).data!);
  }

  // Collection
  static async getAll(): Promise<Block[]> {
    return (await this.dbApi.from().select()).data!.map(d => new Block(d));
  }

  // Filtered query
  static async getByResolver(resolver: string): Promise<Block[]> {
    return (await this.dbApi.from().select().eq("resolver", resolver))
      .data!.map(d => new Block(d));
  }

  // Paginated query
  static async getPaginated(page: number, size: number): Promise<Block[]> {
    const start = page * size;
    const end = start + size - 1;
    return (await this.dbApi.from().select().range(start, end))
      .data!.map(d => new Block(d));
  }
}
```

### 2. Instance Methods for Mutations

```typescript
class Block {
  // Update existing
  public async update(): Promise<Block> {
    return Block.dbApi.first(await Block.dbApi.from().upsert(this).select());
  }

  // Delete
  public async delete(): Promise<void> {
    await Block.dbApi.from().delete().eq("id", this.id);
  }

  // Domain-specific state transition
  public async archive(): Promise<Block> {
    this.archived = true;
    this.archived_at = new Date();
    return this.update();
  }
}
```

### 3. Lazy Loading Pattern

```typescript
class Block {
  private _relations?: Relation[];

  public async getRelations(): Promise<Relation[]> {
    if (this._relations) return this._relations;
    
    this._relations = await Relation.getByBlock(this.id);
    return this._relations;
  }

  public clearCache(): void {
    this._relations = undefined;
  }
}
```

### 4. Content Resolution Flow

```
Block
  ↓
Storage.getRawContent() → Fetches raw data (URL, blob, text)
  ↓
Resolver.getSolvedContent() → Processes and transforms
  ↓
ContentComponent → Renders in UI
```

**Implementation**:

```typescript
// In info-base graph view
const resolver = BaseResolver.create(block.resolver, block);
const solvedContent = await resolver.getSolvedContent();

// Render component
<component
  :is="resolver.contentComp"
  :resolver="resolver"
  :solved-content="solvedContent"
/>
```

### 5. Error Handling

```typescript
class Source {
  static async get(id: SourceRef): Promise<Source> {
    try {
      const { data, error } = await this.dbApi.from().select().eq("id", id).single();
      
      if (error) {
        throw new Error(`Failed to fetch source: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Source ${id} not found`);
      }
      
      return new Source(data);
    } catch (error) {
      console.error(`[Source] Error fetching ${id}:`, error);
      throw error;
    }
  }

  public async collect(params: any): Promise<SourceCollectJob> {
    try {
      const job = await Source.coreApi.request({
        method: "POST",
        path: `/${this.id}/collect`,
        body: { params },
      });
      return new SourceCollectJob(job);
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific API errors
        if (error.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
      }
      throw error;
    }
  }
}
```

### 6. Creating New Business Classes

**Checklist**:

1. Define Ref type and Zod schema
2. Extend `Z.class` with schema
3. Add static API clients (`dbApi`, `coreApi`)
4. Implement static query methods
5. Implement instance mutation methods
6. Create Form class for creation
7. Add prop helpers for Vue components
8. Document in business AGENTS.md

**Template**:

```typescript
// 1. Ref type
export type EntityRef = number;
export const EntityRefZ = z.number();
export const makeEntityProp = (v?: any) => makeObjectProp<Entity>(v);
export const makeEntityRefProp = (v?: any) => makeNumberProp<EntityRef>(v);

// 2. Main class
export class Entity extends Z.class({
  id: EntityRefZ,
  name: z.string(),
  created_at: z.coerce.date().default(() => new Date()),
}) {
  // 3. API clients
  static dbApi = new DBAPIClient("entities", Entity);
  static coreApi = new CoreAPIClient("/entities", Entity);

  // 4. Static queries
  static async get(id: EntityRef): Promise<Entity> {
    return new Entity((await this.dbApi.from().select().eq("id", id).single()).data!);
  }

  static async getAll(): Promise<Entity[]> {
    return (await this.dbApi.from().select()).data!.map(d => new Entity(d));
  }

  // 5. Instance mutations
  public async update(): Promise<Entity> {
    return Entity.dbApi.first(await Entity.dbApi.from().upsert(this).select());
  }

  public async delete(): Promise<void> {
    await Entity.dbApi.from().delete().eq("id", this.id);
  }
}

// 6. Form class
export class EntityForm extends Z.class({
  ...Entity.shape,
  id: z.undefined(),
}) {
  public async create(): Promise<Entity> {
    return new Entity((await Entity.dbApi.from().insert(this).select().single()).data!);
  }
}
```

---

## API Integration

### Query Patterns (PostgREST)

```typescript
// Basic select
const blocks = await Block.dbApi.from().select();

// Select specific columns
const blocks = await Block.dbApi.from().select("id, content, resolver");

// Filtering
const textBlocks = await Block.dbApi.from()
  .select()
  .eq("resolver", "text");

// Multiple conditions
const blocks = await Block.dbApi.from()
  .select()
  .eq("resolver", "text")
  .gt("created_at", "2024-01-01")
  .order("created_at", { ascending: false })
  .limit(10);

// Pattern matching
const blocks = await Block.dbApi.from()
  .select()
  .ilike("content", "%search term%");

// Joins (PostgREST foreign key syntax)
const relations = await Relation.dbApi.from()
  .select("*, source:blocks!source(*), target:blocks!target(*)");

// Count
const { count } = await Block.dbApi.from()
  .select("*", { count: "exact", head: true });

// Range (pagination)
const blocks = await Block.dbApi.from()
  .select()
  .range(0, 9); // First 10 results
```

### Mutation Patterns

```typescript
// Insert single
const newBlock = await Block.dbApi.from()
  .insert({ content: "Hello", resolver: "text" })
  .select()
  .single();

// Insert multiple
const blocks = await Block.dbApi.from()
  .insert([
    { content: "Block 1", resolver: "text" },
    { content: "Block 2", resolver: "text" },
  ])
  .select();

// Update
await Block.dbApi.from()
  .update({ content: "Updated" })
  .eq("id", blockId);

// Upsert (insert or update based on primary key)
const block = await Block.dbApi.from()
  .upsert({ id: 1, content: "Updated", resolver: "text" })
  .select()
  .single();

// Delete
await Block.dbApi.from()
  .delete()
  .eq("id", blockId);

// Conditional delete
await Block.dbApi.from()
  .delete()
  .eq("resolver", "text")
  .lt("created_at", "2023-01-01");
```

### Core API Patterns

```typescript
// POST with body
const job = await Source.coreApi.request({
  method: "POST",
  path: `/${sourceId}/collect`,
  body: { params: { limit: 100 } },
});

// GET with query params
const logs = await Log.coreApi.request({
  method: "GET",
  path: "/logs",
  query: { trace_id: "abc123", limit: 50 },
});

// File upload
const formData = new FormData();
formData.append("file", file);
const storage = await Storage.coreApi.request({
  method: "POST",
  path: "/upload",
  body: formData,
});

// Custom response schema
const result = await Source.coreApi.request({
  method: "POST",
  path: "/analyze",
  body: { sourceId },
  resBodySchema: AnalysisResultSchema,
});
```

---

## References

### Internal Documentation

- [Root Architecture](../ARCHITECTURE.md) - Overall system architecture
- [Info-Base Architecture](./info-base/ARCHITECTURE.md) - Graph system details
- [Component Architecture](../components/ARCHITECTURE.md) - UI layer patterns
- [Business AGENTS.md](./AGENTS.md) - Development guidelines

### Key Files

- [api.ts](./api.ts) - API client implementations
- [base.ts](./base.ts) - Utility functions
- [block.ts](./info-base/block.ts) - Block entity
- [relation.ts](./info-base/relation.ts) - Relation entity
- [source.ts](./source.ts) - Source entity
- [extension.ts](./extension.ts) - Extension management

### External Dependencies

- [zod-class](https://github.com/yyz945947732/zod-class) - Schema-based classes
- [@supabase/postgrest-js](https://github.com/supabase/postgrest-js) - PostgREST client
- [Zod](https://zod.dev/) - Schema validation

---

**Last Updated**: January 2, 2026
