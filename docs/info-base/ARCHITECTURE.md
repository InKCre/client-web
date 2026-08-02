# Client-Web Info-Base Architecture

## Purpose

Describe the peer-local info-base implementation shared by `@inkcre/core` and the browser
applications. Shared product authority lives in the InKCre docs Hub; this document owns
TypeScript models, PostgREST mechanics, resolver/runtime handles, and rendering boundaries.

## Peer Topology

```text
PostgreSQL / PostgREST protocol
            |
            v
  Block + Relation models
            |
   Block.getHydratedContent()
            |
       exact Resolver
            |
 safe solved value / browser handle
            |
       Vue component
```

Client-web is a database-protocol peer, not a thin frontend that delegates every semantic
operation to core-py. Schema/migration authority remains in core-py, while admitted read/write,
storage hydration, resolver interpretation, and rendering execute locally.

## Persisted Graph

### Block

| Field                       | Meaning                                               |
| --------------------------- | ----------------------------------------------------- |
| `id`                        | local graph identity                                  |
| `created_at` / `updated_at` | block-row persistence time                            |
| `resolver`                  | exact resolver contract version                       |
| `storage`                   | selected storage record, or `null` for inline content |
| `content`                   | inline string or opaque storage pointer               |

Do not render `block.content` directly unless `storage === null` and the exact resolver contract
uses that inline value. A storage pointer is mechanics, never authored text.

### Relation

Relations are directed graph authority with `from_`, `to_`, and contract-owned `content`.
`includeIn` means the subject block is `to_`; `includeOut` means it is `from_`. These options
filter direct relations and do not request recursive graph traversal.

Relation payload grammar belongs to its extension/canonical contract. The UI must not invent a
universal relation-type registry or infer ownership from direction alone.

## Block Hydration

`Block.getHydratedContent({ refresh = false })` returns:

- `string` when the block is inline;
- `Uint8Array` when a configured storage resolves the opaque pointer.

The private cache key is `(storage, content)`. Cache properties are non-enumerable so Zod/
transport projections never persist them. A changed pointer misses naturally; `refresh` bypasses
and replaces the current instance snapshot. No cross-instance or cross-peer invalidation is
promised, and storage-backed bytes may change without changing `block.updated_at`.

## Storage System

Storage handlers turn a pointer into bytes. They do not decide MIME, filename, information kind,
or resolver ID.

### Generic HTTP

`HttpStorage` accepts only HTTP(S), enforces timeout/redirect policy and both declared/received
byte limits, then returns `Uint8Array`. It does not branch on `Content-Type`.

### PostgreSQL Binary

`PostgreSQLBinaryStorage` is a complete browser-peer byte capability:

- create: raw `application/octet-stream` RPC returns UUID and storage-owned pointer JSON;
- read: raw RPC returns `application/octet-stream`;
- update: exact `storage_blobs` UUID row update, pointer remains stable;
- delete: exact UUID row delete.

`storage_blobs` is the backing relation, not a storage type or semantic block. The storage
handler alone parses/serializes `{ "blob_id": "..." }`; callers persist only its opaque string.
Storage C/R/U/D never queries or rewrites blocks.

Authentication and origins come from browser-owned runtime config. `rawPostgrestFetch()` reuses
the current JWT/origin authority but exposes a byte-capable response rather than forcing JSON.

## Resolver System

Resolvers interpret hydrated content plus required relations. `Resolver.getClass(id)` is exact;
there is no first/default fallback. Registration is idempotent only for the same class and rejects
collisions.

The shared exact IDs are:

```text
core.text.v1   core.html.v1   core.image.v1
core.audio.v1  core.video.v1  core.pdf.v1
core.epub.v1   core.zip.v1    core.file.v1
```

Core bootstrap registers all nine independently of Module Federation extension loading.
Extensions register their own namespaced, versioned decoders.

### Capability Outcomes

Every concrete resolver implements:

```ts
getText(options?: ProjectionOptions): Promise<string | null>
getStrForEmbedding(options?: ProjectionOptions): Promise<string | null>
```

- `UnknownResolverError`: no exact decoder is registered;
- `UnsupportedResolverCapability`: the decoder does not provide that projection;
- `null`: capability exists but the block has no meaningful value;
- `''`: an actual empty value, not a generic fallback.

Do not collapse these outcomes into an empty preview or reinterpret an unknown ID.

### Effect Vocabulary

- `refresh`: bypass and replace a local hydration/relation/solved snapshot;
- `materializeMissing`: permit creation only when a required derivation is absent;
- `recompute`: reserved for an explicit organization command that regenerates an existing
  derivation;
- `invalidate`: discard cache without loading replacement.

Do not add `force` or `reload` aliases for these effects.

### Media Matching

`Resolver.matchMediaType()` normalizes one candidate MIME and returns an installed exact core
resolver ID or `null`. Source/protocol adapters own evidence order and explicit
`core.file.v1` fallback; the manager does not own one universal classification ladder.

## Browser Runtime Handles

Image/audio/video/PDF/EPUB/ZIP/file resolvers hydrate bytes locally and may expose safe Blob or
Object URL handles. These handles are private runtime state, not solved graph authority, and are
revoked on resolver refresh, disposal, and resolver-cache eviction.

HTML is rendered as a text preview/source action. It is not passed to `v-html` without a separate
sanitizer contract. Parser-derived facts may remain `null` when the browser does not have a
proportionate local parser; open/render/download remains a real capability.

`BlockContent.vue` resolves exact class setup errors visibly, loads solved content, passes it to
the registered component, and disposes the resolver on unmount. Graph/editor surfaces must use
this path rather than falling back to the persisted pointer string.

## Resolver Cache

`ResolverCache` owns reusable resolver instances by block identity/update snapshot. Eviction and
replacement call `dispose()` so object URLs and other handles cannot leak. Resolver-internal solved
content and relation caches still obey `refresh`; cache reuse does not change authority.

## Extension Producer Rules

- Emit exact, versioned resolver IDs.
- Store protocol/source identity and declared metadata in canonical metadata/root blocks.
- Put actual media/document bytes in an exact semantic content block, optionally storage-backed.
- Keep associations in relations rather than copying attachment/reference IDs into root content.
- Never choose a semantic storage type; storage is bytes-only mechanics.

Twitter and browser-extension producers have been cut over to these exact semantic IDs. Retired
bare IDs and media-specific HTTP storage handlers are not compatibility fallbacks.

## Verification

- `packages/core` tests prove inline/storage hydration, refresh, exact registration, typed
  capability outcomes, semantic resolver handles, object URL cleanup, HTTP limits, and PostgreSQL
  binary C/R/U/D.
- database-contract generation tests prove admitted relation/function projection.
- repository `pnpm check` proves TypeScript, Vue, unit tests, formatting/lint, and production builds.
