# Info-Base Architecture

## Table of Contents

- [Overview](#overview)
- [Block Architecture](#block-architecture)
- [Relation Architecture](#relation-architecture)
- [Storage System](#storage-system)
- [Resolver System](#resolver-system)
- [Graph Operations](#graph-operations)
- [Layout System](#layout-system)
- [Extension Points](#extension-points)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)
- [References](#references)

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

**Schema** (from `block.ts`):

```typescript
export class Block extends Z.class({
  id: z.number(),                    // Primary key
  created_at: z.coerce.date(),       // Creation timestamp
  updated_at: z.coerce.date(),       // Last update timestamp
  storage: z.number().nullable(),     // Foreign key to Storage (nullable)
  resolver: z.string(),              // Resolver type identifier
  content: z.string(),               // Raw content or storage key
}) {
  static dbApi = new DBAPIClient("blocks", Block);
  static coreApi = new CoreAPIClient("/blocks", Block);

  static async get(id: BlockRef): Promise<Block> {
    return new Block((await this.dbApi.from().select().eq("id", id)).data![0]);
  }

  static async getAll(): Promise<Block[]> {
    return (await this.dbApi.from().select()).data!.map(d => new Block(d));
  }

  static async getRecent(limit: number = 10): Promise<Block[]> {
    return (await this.dbApi
      .from()
      .select()
      .order("updated_at", { ascending: false })
      .limit(limit)
    ).data!.map(d => new Block(d));
  }

  public async update(): Promise<Block> {
    return Block.dbApi.first(await Block.dbApi.from().upsert(this).select());
  }
}
```

### Block Fields

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

```typescript
// Create
const form = new BlockForm({
  content: "Hello World",
  resolver: "text",
  storage: null,
});
const block = await form.create();

// Read
const block = await Block.get(blockId);

// Update
block.content = "Updated content";
await block.update();

// Delete (cascade deletes relations)
await Block.dbApi.from().delete().eq("id", blockId);
```

---

## Relation Architecture

### Data Model

**Schema** (from `relation.ts`):

```typescript
export class Relation extends Z.class({
  id: z.number(),
  created_at: z.coerce.date(),
  source: BlockRefZ,              // Source block ID
  target: BlockRefZ,              // Target block ID
  type: z.string().optional(),    // Relation type (e.g., "references", "cites")
  metadata: z.record(z.any()).optional().default({}),
}) {
  static dbApi = new DBAPIClient("relations", Relation);

  static async getByBlock(blockId: BlockRef): Promise<Relation[]> {
    return (await this.dbApi
      .from()
      .select()
      .or(`source.eq.${blockId},target.eq.${blockId}`)
    ).data!.map(d => new Relation(d));
  }

  static async getOutgoing(blockId: BlockRef): Promise<Relation[]> {
    return (await this.dbApi
      .from()
      .select()
      .eq("source", blockId)
    ).data!.map(d => new Relation(d));
  }

  static async getIncoming(blockId: BlockRef): Promise<Relation[]> {
    return (await this.dbApi
      .from()
      .select()
      .eq("target", blockId)
    ).data!.map(d => new Relation(d));
  }

  public async update(): Promise<Relation> {
    return Relation.dbApi.first(await Relation.dbApi.from().upsert(this).select());
  }
}
```

### Relation Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | number | Unique identifier |
| `created_at` | Date | Creation timestamp |
| `source` | BlockRef | Source block (from) |
| `target` | BlockRef | Target block (to) |
| `type` | string | Relation type/semantics (optional) |
| `metadata` | Record | Additional relation data (optional) |

### Directionality

Relations are **directed** by default: `source → target`

```typescript
// Create directed relation: A → B
const relation = await new RelationForm({
  source: blockA.id,
  target: blockB.id,
  type: "references",
}).create();

// Query patterns
const outgoing = await Relation.getOutgoing(blockA.id); // A → ?
const incoming = await Relation.getIncoming(blockB.id);  // ? → B
const all = await Relation.getByBlock(blockA.id);        // A ↔ ?
```

### Relation Types

Relation types are **domain-specific** and defined by the application:

- `"references"` - Citations or links
- `"childOf"` - Hierarchical parent-child
- `"relatedTo"` - General association
- `"derivedFrom"` - Transformation or derivation

Extensions can define custom types.

---

## Storage System

### Purpose

The **Storage system** abstracts content retrieval, allowing blocks to reference content stored externally (URLs, blobs, databases) rather than inline in the `block.content` field.

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

### Storage Model

**Schema** (from `storage.ts`):

```typescript
export class Storage<RawContentT = unknown> extends Z.class({
  id: z.number().optional(),
  type: z.string(),                    // Storage type identifier
  nickname: z.string().nullable(),     // User-friendly name
  config: z.looseObject({}).default({}),  // Type-specific configuration
}) {
  static dbApi = new DBAPIClient("storages", Storage);

  // Abstract method - subclasses implement
  protected async _getRawContent(block: Block): Promise<RawContentT> {
    throw new Error("_getRawContent must be implemented by subclass");
  }

  // Public interface with error handling
  public async getRawContent(block: Block): Promise<RawContentT> {
    try {
      return await this._getRawContent(block);
    } catch (error) {
      console.error(`[Storage ${this.type}] Failed to get content:`, error);
      throw error;
    }
  }

  // Factory method
  static create(data: any): Storage {
    const StorageClass = Storage.storageClasses.get(data.type);
    if (!StorageClass) {
      throw new Error(`Unknown storage type: ${data.type}`);
    }
    return new StorageClass(data);
  }
}
```

### Storage Registry

**Decorator-based registration**:

```typescript
@Storage.registry("url")
export class URLStorage extends Storage<string> {
  protected async _getRawContent(block: Block): Promise<string> {
    const url = this.config.url || block.content;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }
}

@Storage.registry("blob")
export class BlobStorage extends Storage<string> {
  protected async _getRawContent(block: Block): Promise<string> {
    const blobId = this.config.blobId || block.content;
    const response = await Storage.coreApi.request({
      method: "GET",
      path: `/blob/${blobId}`,
    });
    return response;
  }
}

@Storage.registry("text")
export class TextStorage extends Storage<string> {
  protected async _getRawContent(block: Block): Promise<string> {
    return this.config.text || block.content;
  }
}
```

### Storage Types

**StorageType** defines available storage types with schemas:

```typescript
export class StorageType extends Z.class({
  id: z.string(),                  // e.g., "url", "blob", "extensions.twitter.media"
  description: z.string().optional(),
  config_schema: z.record(z.unknown()).optional(),
}) {
  static dbApi = new DBAPIClient("storage_types", StorageType);
}
```

### Content Retrieval Flow

```typescript
// In Resolver
protected async getRawContent(): Promise<RawContentT> {
  if (this.block.storage === null) {
    // Inline content
    return this.block.content as RawContentT;
  }

  // Fetch storage instance
  const storage = await Storage.get(this.block.storage);
  
  // Delegate to storage handler
  return storage.getRawContent(this.block);
}
```

---

## Resolver System

### Purpose

**Resolvers** define how block content is **processed and displayed**. Each resolver type handles a specific content format (text, image, HTML, tweet, etc.).

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

**From `resolver.ts`**:

```typescript
export interface Resolver<RawContentT = string, SolvedContentT = RawContentT> {
  readonly type: string;                    // Type identifier
  readonly contentComp: Component;          // Vue component for display
  readonly block: Block;                    // Block being resolved
  readonly solvedContentState: Ref<ResolverContentState>;  // Loading state
  
  getRelations(): Promise<Relation[]>;      // Lazy-load relations
  getSolvedContent(forceRefresh?: boolean): Promise<SolvedContentT>;
  dispose(): Promise<void>;                 // Cleanup
}

export interface ContentCompProps<SolvedContentT = any> {
  resolver: Resolver<any, SolvedContentT>;
  solvedContent: SolvedContentT;
}
```

### Base Resolver Implementation

```typescript
export abstract class BaseResolver<RawContentT = string, SolvedContentT = RawContentT>
  implements Resolver<RawContentT, SolvedContentT>
{
  abstract readonly type: string;
  abstract readonly contentComp: Component;

  readonly block: Block;
  private _relations: Relation[] | null = null;
  private _rawContent: RawContentT | null = null;
  private _solvedContent: SolvedContentT | null = null;
  
  readonly solvedContentState: Ref<ResolverContentState> = ref({
    status: "idle",
    error: null,
  });

  constructor(block: Block, relations?: Relation[]) {
    this.block = block;
    this._relations = relations ?? null;

    // Inline content optimization
    if (block.storage === null) {
      this._rawContent = block.content as RawContentT;
    }
  }

  // Lazy-load relations
  public async getRelations(): Promise<Relation[]> {
    if (this._relations === null) {
      this._relations = await Relation.getByBlock(this.block.id);
    }
    return this._relations;
  }

  // Fetch raw content from storage or inline
  protected async getRawContent(): Promise<RawContentT> {
    if (this._rawContent !== null) return this._rawContent;

    if (this.block.storage === null) {
      this._rawContent = this.block.content as RawContentT;
    } else {
      const storage = await Storage.get(this.block.storage);
      this._rawContent = await storage.getRawContent(this.block);
    }

    return this._rawContent;
  }

  // Public API with caching and state management
  public async getSolvedContent(forceRefresh = false): Promise<SolvedContentT> {
    if (this._solvedContent !== null && !forceRefresh) {
      return this._solvedContent;
    }

    this.solvedContentState.value = { status: "loading", error: null };

    try {
      this._solvedContent = await this._getSolvedContent();
      this.solvedContentState.value = { status: "success", error: null };
      return this._solvedContent;
    } catch (error) {
      this.solvedContentState.value = {
        status: "error",
        error: error as Error,
      };
      throw error;
    }
  }

  // Abstract method - subclasses implement
  protected abstract _getSolvedContent(): Promise<SolvedContentT>;

  public async dispose(): Promise<void> {
    // Cleanup if needed
  }
}
```

### Built-in Resolvers

**Text Resolver**:

```typescript
import { markRaw } from "vue";
import ContentText from "../components/ContentText.vue";

@BaseResolver.registry("text")
export class TextResolver extends BaseResolver<string, string> {
  readonly type = "text";
  readonly contentComp = markRaw(ContentText);

  protected async _getSolvedContent(): Promise<string> {
    return this.getRawContent(); // No processing needed
  }
}
```

**Image Resolver**:

```typescript
@BaseResolver.registry("image")
export class ImageResolver extends BaseResolver<string, { url: string; alt?: string }> {
  readonly type = "image";
  readonly contentComp = markRaw(ContentImage);

  protected async _getSolvedContent(): Promise<{ url: string; alt?: string }> {
    const rawContent = await this.getRawContent();
    
    // If storage is used, rawContent is the image data
    // Otherwise, it's a URL
    if (this.block.storage !== null) {
      return { url: `data:image/png;base64,${btoa(rawContent)}` };
    }
    
    return { url: rawContent };
  }
}
```

### Content Component Pattern

**Content components** receive `ContentCompProps`:

```vue
<script setup lang="ts">
import type { ContentCompProps } from "@/business/info-base/resolver";

const props = defineProps<ContentCompProps<string>>();

// Access resolver and block
console.log(props.resolver.block.id);

// Access pre-resolved content
const content = props.solvedContent;
</script>

<template>
  <div class="content-text">
    {{ content }}
  </div>
</template>
```

### Resolver Registry

**ResolverManager** (singleton pattern):

```typescript
export class ResolverManager {
  private static _types: Map<string, typeof BaseResolver> = new Map();

  static registry(type: string) {
    return function <T extends typeof BaseResolver>(constructor: T) {
      ResolverManager._types.set(type, constructor);
      return constructor;
    };
  }

  static create(type: string, block: Block): BaseResolver {
    const ResolverClass = ResolverManager._types.get(type) || DefaultResolver;
    return new ResolverClass(block);
  }

  static getTypes(): string[] {
    return Array.from(ResolverManager._types.keys());
  }
}
```

### Resolver Lifecycle

```
1. Create: const resolver = ResolverManager.create("text", block);
2. Fetch:  const content = await resolver.getSolvedContent();
   ├─ status: "loading"
   ├─ getRawContent() → from storage or inline
   ├─ _getSolvedContent() → process content
   └─ status: "success" or "error"
3. Cache:  Subsequent calls return cached content
4. Dispose: await resolver.dispose();
```

---

## Graph Operations

### Graph Data Structure

InKCre uses **graphology** for graph operations:

```typescript
import Graph from "graphology";

// Build graph from blocks and relations
const graph = new Graph();

blocks.forEach(block => {
  graph.addNode(block.id.toString(), { block });
});

relations.forEach(rel => {
  graph.addEdge(rel.source.toString(), rel.target.toString(), { relation: rel });
});
```

### Community Detection

**Louvain Algorithm** for community detection:

```typescript
import louvain from "graphology-communities-louvain";

export function detectCommunities(blocks: Block[], relations: Relation[]) {
  const graph = buildGraph(blocks, relations);
  
  // Run Louvain algorithm
  const communities = louvain(graph, {
    resolution: 1.0,
    randomWalk: false,
  });

  // Group blocks by community
  const communityMap = new Map<string, Block[]>();
  blocks.forEach(block => {
    const community = communities[block.id.toString()];
    if (!communityMap.has(community)) {
      communityMap.set(community, []);
    }
    communityMap.get(community)!.push(block);
  });

  return communityMap;
}
```

**Usage in views**:

```typescript
import { useCommunityDetection } from "@/composables/useCommunityDetection";

const { communities, detectCommunities } = useCommunityDetection();

await detectCommunities(blocks, relations);
// communities.value = Map<string, Block[]>
```

### Shortest Path

```typescript
import { bidirectional } from "graphology-shortest-path";

export function findShortestPath(
  graph: Graph,
  sourceId: string,
  targetId: string
): string[] | null {
  try {
    return bidirectional(graph, sourceId, targetId);
  } catch {
    return null; // No path exists
  }
}
```

### Topology Detection

**DAG Detection**:

```typescript
import { isAcyclic } from "graphology-dag";

export function detectTopology(graph: Graph): TopologyType {
  if (graph.order === 0) return TopologyType.Empty;
  if (graph.order === 1) return TopologyType.Single;
  
  if (isAcyclic(graph)) {
    // Check if tree (all nodes have at most one parent)
    const isTree = graph.nodes().every(node => {
      return graph.inDegree(node) <= 1;
    });
    return isTree ? TopologyType.Tree : TopologyType.DAG;
  }
  
  // Check if star (one central node, all others leaf)
  const degrees = graph.nodes().map(n => graph.degree(n));
  const maxDegree = Math.max(...degrees);
  const numHighDegree = degrees.filter(d => d === maxDegree).length;
  
  if (numHighDegree === 1 && degrees.filter(d => d === 1).length === degrees.length - 1) {
    return TopologyType.Star;
  }
  
  return TopologyType.General;
}
```

---

## Layout System

### Layout Manager Architecture

The **Layout Manager** coordinates multiple layout algorithms and provides auto-detection based on graph topology.

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

### Layout Manager Implementation

**From `useLayoutManager.ts`**:

```typescript
export function useLayoutManager(options: UseLayoutManagerOptions) {
  const { nodes, edges, links, onPositionUpdate } = options;
  
  const currentLayout = ref<LayoutType>(LayoutType.Auto);
  const isAutoMode = ref(true);
  const detectedTopology = ref<TopologyType | null>(null);

  // Topology detection
  const topology = useTopologyDetection();

  // Layout composables
  const dagreLayout = useDagreLayout();
  const circularLayout = useCircularLayout();
  const radialLayout = useRadialLayout();
  const gridLayout = useGridLayout();
  const forceLayout = useForceLayout({
    nodes,
    links,
    config: { width: 800, height: 600 },
    onPositionUpdate,
  });

  // Effective layout (auto-detect or manual)
  const effectiveLayout = computed(() => {
    if (!isAutoMode.value) {
      return currentLayout.value;
    }

    const analysis = topology.analyze(nodes.value, edges.value);
    detectedTopology.value = analysis.type;
    return analysis.suggestedLayout;
  });

  // Apply layout
  async function applyLayout(): Promise<void> {
    isRunning.value = true;

    try {
      let result: LayoutResult;

      switch (effectiveLayout.value) {
        case LayoutType.Dagre:
          result = await dagreLayout.compute(nodes.value, edges.value);
          break;
        case LayoutType.Circular:
          result = await circularLayout.compute(nodes.value);
          break;
        case LayoutType.Radial:
          result = await radialLayout.compute(nodes.value, edges.value);
          break;
        case LayoutType.Grid:
          result = await gridLayout.compute(nodes.value);
          break;
        case LayoutType.Force:
        default:
          // Force layout is reactive, just start simulation
          forceLayout.start();
          return;
      }

      onPositionUpdate(result.positions);
    } finally {
      isRunning.value = false;
    }
  }

  return {
    currentLayout,
    effectiveLayout,
    isAutoMode,
    detectedTopology,
    isRunning,
    applyLayout,
    setLayout,
    forceLayout,
  };
}
```

### Force-Directed Layout

**Physics simulation** using d3-force:

```typescript
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

export function useForceLayout(options: UseForceLayoutOptions) {
  let simulation: Simulation<Node, SimulationLink> | null = null;

  function start() {
    if (simulation) {
      simulation.restart();
      return;
    }

    simulation = forceSimulation(options.nodes.value)
      .force("link", forceLink(options.links.value)
        .id(d => d.id)
        .distance(100))
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(options.config.width / 2, options.config.height / 2))
      .force("collide", forceCollide(40))
      .on("tick", () => {
        const positions = new Map();
        options.nodes.value.forEach(node => {
          positions.set(node.id, { x: node.position.x, y: node.position.y });
        });
        options.onPositionUpdate(positions);
      });
  }

  function stop() {
    simulation?.stop();
  }

  return { start, stop, simulation: computed(() => simulation) };
}
```

### Dagre Layout (Hierarchical)

**Layered graph layout** for DAGs:

```typescript
import dagre from "dagre";

export function useDagreLayout() {
  async function compute(nodes: Node[], edges: Edge[]): Promise<LayoutResult> {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes
    nodes.forEach(node => {
      g.setNode(node.id, { width: 100, height: 50 });
    });

    // Add edges
    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });

    // Run layout
    dagre.layout(g);

    // Extract positions
    const positions = new Map();
    g.nodes().forEach(nodeId => {
      const node = g.node(nodeId);
      positions.set(nodeId, { x: node.x, y: node.y });
    });

    return { positions };
  }

  return { compute };
}
```

### Vue Flow Integration

**In graph view**:

```vue
<script setup lang="ts">
import { VueFlow, useVueFlow } from "@vue-flow/core";
import { useLayoutManager } from "@/composables/useLayoutManager";

const { nodes, edges } = useVueFlow();

const layoutManager = useLayoutManager({
  nodes,
  edges,
  links: computed(() => edges.value.map(e => ({
    source: nodes.value.find(n => n.id === e.source),
    target: nodes.value.find(n => n.id === e.target),
  }))),
  onPositionUpdate: (positions) => {
    positions.forEach((pos, id) => {
      const node = nodes.value.find(n => n.id === id);
      if (node) {
        node.position = pos;
      }
    });
  },
});

// Apply initial layout
onMounted(() => {
  layoutManager.applyLayout();
});
</script>

<template>
  <VueFlow :nodes="nodes" :edges="edges">
    <Controls />
    <Background />
  </VueFlow>
  
  <button @click="layoutManager.setLayout(LayoutType.Dagre)">
    Hierarchical
  </button>
  <button @click="layoutManager.setLayout(LayoutType.Force)">
    Force-Directed
  </button>
</template>
```

---

## Extension Points

### Custom Resolvers

Extensions can register custom resolvers:

```typescript
// In extension/resolver.ts
import { BaseResolver } from "@host/business/info-base/resolver";
import ContentTweet from "./components/ContentTweet.vue";
import { markRaw } from "vue";

interface Tweet {
  id: string;
  text: string;
  author: string;
}

@BaseResolver.registry("tweet")
export class TweetResolver extends BaseResolver<string, Tweet> {
  readonly type = "tweet";
  readonly contentComp = markRaw(ContentTweet);

  protected async _getSolvedContent(): Promise<Tweet> {
    const tweetId = await this.getRawContent();
    
    // Fetch tweet data from Twitter API
    const response = await fetch(`https://api.twitter.com/tweets/${tweetId}`);
    return response.json();
  }
}

// In extension/Extension.ts
import "./resolver"; // Side-effect registration

export default {
  async initialize() {
    console.log("[Twitter] TweetResolver registered");
  },
};
```

### Custom Storage

Extensions can add storage types:

```typescript
@Storage.registry("extensions.twitter.media")
export class TwitterMediaStorage extends Storage<Blob> {
  protected async _getRawContent(block: Block): Promise<Blob> {
    const mediaUrl = this.config.url;
    const response = await fetch(mediaUrl);
    return response.blob();
  }
}
```

### Extension Lifecycle

```
Extension.initialize()
  ↓ (decorators execute)
Resolver/Storage registered in global registry
  ↓
Extension.activate()
  ↓
Resolvers/Storages available for use
  ↓
Extension.deactivate()
  ↓
Cleanup (future: unregister types)
```

---

## Performance Considerations

### 1. Lazy Loading

**Avoid loading all relations upfront**:

```typescript
// Good: Lazy load when needed
const relations = await resolver.getRelations();

// Bad: Preload all relations for all blocks
const allRelations = await Promise.all(blocks.map(b => Relation.getByBlock(b.id)));
```

### 2. Content Caching

Resolvers automatically cache `_getSolvedContent()` results:

```typescript
// First call: fetches and processes
const content1 = await resolver.getSolvedContent();

// Subsequent calls: returns cached
const content2 = await resolver.getSolvedContent(); // Fast!

// Force refresh if needed
const content3 = await resolver.getSolvedContent(true);
```

### 3. Large Graph Handling

**Pagination for large graphs**:

```typescript
// Load blocks in batches
async function* loadBlocksBatched(batchSize = 100) {
  let offset = 0;
  while (true) {
    const batch = await Block.dbApi
      .from()
      .select()
      .range(offset, offset + batchSize - 1);
    
    if (batch.data.length === 0) break;
    yield batch.data.map(d => new Block(d));
    offset += batchSize;
  }
}

// Usage
for await (const blocks of loadBlocksBatched()) {
  processBlocks(blocks);
}
```

### 4. Virtual Scrolling

For large lists, use virtual scrolling (e.g., `vue-virtual-scroller`):

```vue
<RecycleScroller
  :items="blocks"
  :item-size="80"
  key-field="id"
>
  <template #default="{ item }">
    <BlockCard :block="item" />
  </template>
</RecycleScroller>
```

### 5. Debounced Graph Updates

When editing, debounce graph re-renders:

```typescript
import { useDebounceFn } from "@vueuse/core";

const updateGraph = useDebounceFn(() => {
  layoutManager.applyLayout();
}, 500);

watch([blocks, relations], updateGraph);
```

---

## Best Practices

### 1. Resolver Development

- **Keep resolvers stateless**: All state in block/relations
- **Use caching**: Leverage built-in `_solvedContent` cache
- **Handle errors**: Wrap `_getSolvedContent` in try-catch
- **Mark components raw**: Use `markRaw()` for `contentComp`

### 2. Storage Development

- **Validate config**: Use Zod schemas in StorageType
- **Handle failures**: Graceful degradation if content unavailable
- **Optimize retrieval**: Cache at storage level if appropriate
- **Document config schema**: Clear documentation for extensions

### 3. Graph Operations

- **Use graphology**: Don't reinvent graph algorithms
- **Batch queries**: Load blocks + relations together when possible
- **Limit depth**: For traversals, set maximum depth
- **Index properly**: Ensure database indexes on `source`/`target`

### 4. Layout Development

- **Responsive sizing**: Accept width/height parameters
- **Incremental updates**: Support position updates without full recompute
- **Configurable**: Expose layout parameters (spacing, direction, etc.)
- **Performance**: Use Web Workers for expensive computations

### 5. Component Integration

- **Use ContentCompProps**: Standard interface for content components
- **Handle loading states**: Show spinners during `solvedContentState.loading`
- **Error boundaries**: Catch and display resolver errors
- **Dispose properly**: Call `resolver.dispose()` on unmount

---

## References

### Internal Documentation

- [Root Architecture](../../ARCHITECTURE.md) - Overall system
- [Business Architecture](../ARCHITECTURE.md) - Business module layer
- [Component Architecture](../../components/ARCHITECTURE.md) - UI components

### Key Files

- [block.ts](./block.ts) - Block entity
- [relation.ts](./relation.ts) - Relation entity
- [storage.ts](./storage.ts) - Storage system
- [resolver.ts](./resolver.ts) - Resolver system
- [graph/](./graph/) - Graph algorithms
- [resolvers/](./resolvers/) - Built-in resolvers
- [storages/](./storages/) - Built-in storages

### Composables

- [useLayoutManager.ts](../../composables/useLayoutManager.ts) - Layout orchestration
- [useForceLayout.ts](../../composables/useForceLayout.ts) - Force-directed layout
- [useCommunityDetection.ts](../../composables/useCommunityDetection.ts) - Community detection
- [useTopologyDetection.ts](../../composables/useTopologyDetection.ts) - Topology analysis

### External Dependencies

- [graphology](https://graphology.github.io/) - Graph data structure
- [@vue-flow/core](https://vueflow.dev/) - Graph visualization
- [d3-force](https://github.com/d3/d3-force) - Physics simulation
- [dagre](https://github.com/dagrejs/dagre) - Hierarchical layout
- [graphology-communities-louvain](https://graphology.github.io/standard-library/communities-louvain) - Community detection

---

**Last Updated**: January 2, 2026
