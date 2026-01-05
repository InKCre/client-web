# Info-Base Architecture

## Table of Contents

- Overview
- Block Architecture
- Relation Architecture
- Storage System
- Resolver System
- Graph Operations
- Layout System
- Extension Points

---

## Overview

The **info-base** is InKCre's knowledge graph subsystem, providing a flexible graph-based information model with pluggable content types and storage backends.

### Core Concepts

```
┌──────────────────────────────────────────────┐
│           Knowledge Graph                     │
│                                               │
│  ┌───────┐         ┌───────┐                │
│  │ Block │────────→│ Block │                │
│  │ (Node)│         │ (Node)│                │
│  └───┬───┘         └───────┘                │
│      │                                        │
│      │ Relation (Edge)                       │
│      ↓                                        │
│  ┌───────┐                                   │
│  │ Block │                                   │
│  └───────┘                                   │
└──────────────────────────────────────────────┘

Block:    Information unit (node)
Relation: Connection between blocks (edge)
Storage:  Where block content is stored
Resolver: How block content is displayed
```

### Key Features

- **Graph-based**: Blocks as nodes, relations as edges
- **Typed Content**: Resolver system for different content types
- **Pluggable Storage**: Abstract storage layer (URL, Blob, Text, etc.)
- **Lazy Loading**: On-demand content and relation fetching
- **Extensible**: Extensions can add custom resolvers/storages
- **Visualization**: Vue Flow integration with multiple layouts

### Star Graph Pattern

Each block can be resolved with its **star graph** - the block plus all directly connected relations:

```
       ┌─────────┐
       │ Block A │
       └────┬────┘
            │
    ┌───────┼───────┐
    │       │       │
┌───▼───┐ ┌─▼─────┐ ┌▼───────┐
│Block B│ │Block C│ │Block D │
└───────┘ └───────┘ └────────┘

Star Graph = {Block A, Relations to B/C/D}
```

---

## Block Architecture

### Data Model

Blocks represent information units with the following key fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number | Unique identifier |
| `created_at` | Date | Creation timestamp |
| `updated_at` | Date | Last modification timestamp |
| `storage` | number \| null | FK to Storage table (null = inline content) |
| `resolver` | string | Resolver type identifier (e.g., "text", "image", "tweet") |
| `content` | string | Raw content if `storage` is null, otherwise storage key/URL |

### Content Resolution

**Two-tier resolution**:

1. **Storage Layer** (optional): Fetch actual content if `storage` is set
2. **Resolver Layer**: Process and transform content for display

```
Block
  ↓
storage != null?
  ├─ Yes → Storage.getRawContent()
  └─ No  → Use block.content directly
  ↓
Resolver._getSolvedContent()
  ↓
ContentComponent (Vue)
```

### Lifecycle

Blocks support standard CRUD operations: create, read, update, delete. Relations are cascade-deleted when blocks are removed.

---

## Relation Architecture

### Data Model

Relations connect blocks with the following key fields:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number | Unique identifier |
| `created_at` | Date | Creation timestamp |
| `source` | BlockRef | Source block (from) |
| `target` | BlockRef | Target block (to) |
| `type` | string | Relation type/semantics (optional) |
| `metadata` | Record | Additional relation data (optional) |

### Directionality

Relations are **directed**: `source → target`

Query patterns:

- Outgoing: Relations from a block
- Incoming: Relations to a block
- Bidirectional: All relations involving a block

### Relation Types

Relation types are domain-specific:

- `"references"` - Citations or links
- `"childOf"` - Hierarchical parent-child
- `"relatedTo"` - General association
- `"derivedFrom"` - Transformation or derivation

Extensions can define custom types.

---

## Storage System

### Purpose

The **Storage system** abstracts content retrieval, allowing blocks to reference content stored externally rather than inline.

### Architecture

```
┌─────────────────────────────────────────┐
│  Storage (Abstract Base Class)          │
│  - id, type, config                     │
│  - getRawContent() → Promise<string>    │
└────────────┬────────────────────────────┘
             │ extends
      ┌──────┴──────┬──────────┬──────────┐
      │             │          │          │
┌─────▼──────┐ ┌───▼───┐ ┌────▼────┐ ┌───▼────┐
│URLStorage  │ │Blob   │ │Text     │ │Custom  │
│(HTTP)      │ │Storage│ │Storage  │ │(Ext)   │
└────────────┘ └───────┘ └─────────┘ └────────┘
```

### Storage Registry

**Decorator-based registration** allows extensions to add new storage types. Each storage type implements `getRawContent()` for content retrieval.

### Key Differences

- **Inline vs External**: Null storage uses `block.content`; set storage delegates to storage handler
- **Type-specific Config**: Each storage type has configurable parameters
- **Error Handling**: Storage layer provides consistent error handling and logging

---

## Resolver System

### Purpose

**Resolvers** define how block content is processed and displayed. Each resolver type handles a specific content format.

### Architecture

```
┌─────────────────────────────────────────────┐
│  BaseResolver (Abstract)                    │
│  - type, contentComp                        │
│  - getSolvedContent() → caching             │
│  - _getSolvedContent() → subclass impl      │
└───────────────┬─────────────────────────────┘
                │ extends
      ┌─────────┴─────┬───────────┬────────┐
      │               │           │        │
┌─────▼─────┐  ┌──────▼───┐ ┌────▼───┐  ┌─▼────────┐
│Text       │  │Image     │ │HTML    │  │Tweet     │
│Resolver   │  │Resolver  │ │Resolver│  │(Extension)
└───────────┘  └──────────┘ └────────┘  └──────────┘
```

### Resolver Interface

Resolvers provide:

- Content processing and caching
- Lazy relation loading
- Vue component integration
- Loading state management

### Content Component Pattern

Content components receive standardized props:

- `resolver`: Resolver instance
- `solvedContent`: Processed content

### Resolver Registry

The `Resolver` base class now hosts the registry itself using `Resolver.register`, `Resolver.registry`, and `Resolver.getClass` so implementations can self-register their `type` and the UI can resolve them by identifier.

### Resolver Lifecycle

1. Create resolver instance
2. Fetch and process content (with caching)
3. Display via Vue component
4. Dispose on cleanup

---

## Graph Operations

### Graph Data Structure

Uses **graphology** library for graph operations, converting blocks to nodes and relations to edges.

### Community Detection

**Louvain Algorithm** groups related blocks into communities for visualization and analysis.

### Shortest Path

Bidirectional search finds shortest paths between blocks.

### Topology Detection

Analyzes graph structure to identify:

- DAG (Directed Acyclic Graph)
- Tree
- Star
- General graphs

### CRUD Operations

- **Create**: Add blocks and relations
- **Read**: Query by ID, recent, or relationships
- **Update**: Modify block/relation properties
- **Delete**: Remove with cascade handling

### Performance

- Lazy loading prevents unnecessary fetches
- Caching reduces redundant processing
- Batch operations for bulk updates
- Pagination for large datasets

---

## Layout System

### Layout Manager Architecture

The **Layout Manager** auto-detects graph topology and selects appropriate algorithms.

```
┌───────────────────────────────────────────┐
│         useLayoutManager                  │
│  - Auto-detect topology                   │
│  - Select appropriate layout              │
│  - Apply layout and update positions      │
└───────────┬───────────────────────────────┘
            │ uses
    ┌───────┴───────┬──────────┬──────────┐
    │               │          │          │
┌───▼────┐  ┌──────▼───┐  ┌───▼───┐  ┌───▼────┐
│Force   │  │Dagre     │  │Circular│  │Radial  │
│Layout  │  │(Layered) │  │Layout  │  │Layout  │
└────────┘  └──────────┘  └────────┘  └────────┘
```

### Available Layouts

| Layout | Best For | Description |
|--------|----------|-------------|
| **Force** | General graphs | Physics simulation, organic feel |
| **Dagre** | DAGs, Trees | Hierarchical layered layout |
| **Circular** | Cycles, Small graphs | Nodes arranged in circle |
| **Radial** | Star, Hierarchies | Concentric circles from root |
| **Grid** | Large graphs | Uniform grid arrangement |
| **Auto** | Any | Auto-detect topology and choose |

### Key Differences

- **Force-Directed**: Physics-based, good for organic layouts but computationally intensive
- **Hierarchical (Dagre)**: Layered approach ideal for DAGs and trees
- **Circular/Radial**: Space-efficient for dense or hierarchical graphs
- **Grid**: Predictable positioning for large, uniform datasets

### Vue Flow Integration

Layouts update node positions in Vue Flow graphs, supporting manual and automatic modes.

---

## Extension Points

### Custom Resolvers

Extensions register resolvers using decorators:

```typescript
@BaseResolver.registry("customType")
export class CustomResolver extends BaseResolver {
  // Implement content processing
}
```

### Custom Storage

Extensions add storage types:

```typescript
@Storage.registry("customStorage")
export class CustomStorage extends Storage {
  // Implement content retrieval
}
```

### Extension Lifecycle

Extensions initialize during startup, registering types that become available system-wide. Deactivation cleans up resources.

---

**Last Updated**: January 2, 2026
