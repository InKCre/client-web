# Info-Base Unit

## Boundary and Flow

The Info-Base unit spans the core models and mechanics, extension-provided semantics, and browser
rendering surfaces. It executes admitted reads/writes, hydration, interpretation, and rendering
locally; being a browser application does not make Client-Web a thin proxy to core-py.

```text
PostgreSQL/PostgREST --> Block + Relation --> hydrate --> exact Resolver
                                                |            |
                                                v            v
                                             bytes     solved value / safe handle --> component
```

Schema and migration authority, product meaning, and cross-unit knowledge contracts remain in
[`../_shared/`](../_shared/). This owner describes the TypeScript realization and its internal
authority boundaries.

## Persisted Graph

`Block` owns graph identity, persistence timestamps, an exact Resolver ID, optional Storage record,
and `content`. When Storage is absent, content is the inline value; when Storage is present, content
is an opaque pointer. A pointer is mechanics and must never be rendered as authored text.

`Relation` is directed authority: `from_` and `to_` identify endpoints and `content` follows its
owning contract. `includeIn` selects direct relations where the subject is `to_`; `includeOut`
selects those where it is `from_`. Neither implies recursive traversal. Direction alone does not
define a universal relation type or semantic owner.

## Hydration and Storage

`Block.getHydratedContent({ refresh })` returns the inline string or asks the configured Storage to
turn the opaque pointer into `Uint8Array`. Its private, non-enumerable cache is keyed by the
`(storage, content)` snapshot, so schema/transport projection cannot persist it and a changed
pointer misses naturally. `refresh` replaces only this instance's snapshot. There is no promised
cross-instance or cross-Peer invalidation, and storage bytes may change without a Block timestamp
change.

Storage is a byte mechanism. It does not decide MIME type, filename, information kind, Resolver ID,
or solved meaning.

- `HttpStorage` accepts HTTP(S), bounds timeout and redirects, enforces declared and received byte
  limits, and returns bytes without branching on `Content-Type`.
- `PostgreSQLBinaryStorage` provides browser-peer create/read/update/delete for raw bytes. Its
  storage-owned pointer is exactly `{ "blob_id": "..." }`; create/read use byte RPCs and
  update/delete address the exact UUID row. Storage operations never query or rewrite Blocks.
- `rawPostgrestFetch()` reuses browser origin and JWT authority while preserving a byte-capable
  response rather than forcing the JSON client abstraction.

## Exact Resolver Contracts

`Resolver.getClass(id)` requires an exact registered class. Registration is idempotent only for
the same class and rejects collisions; there is no default decoder. Core bootstrap independently
registers the versioned text, HTML, image, audio, video, PDF, EPUB, ZIP, and file contracts.
Extensions register their own namespaced, versioned contracts rather than aliases for retired IDs.

Every concrete Resolver exposes `getText({ context })`, where `default` and `lexical` are named,
resolver-owned projections. Lexical projection is Block-local and non-recursive. Callers preserve
four distinct results:

- `UnknownResolverError`: no exact decoder is installed;
- `UnsupportedResolverCapability`: the decoder does not implement the requested projection;
- `null`: the capability exists but has no meaningful value;
- `''`: the actual solved value is empty.

The effect vocabulary is also exact: `refresh` replaces a local snapshot,
`materializeMissing` permits creation only when a required derivation is absent, `recompute` is an
explicit organization command for replacing an existing derivation, and `invalidate` discards a
cache without loading. `force` and `reload` are not synonyms.

Media matching normalizes one MIME candidate and returns an installed exact core Resolver ID or
`null`. Source/protocol adapters own evidence ordering and any explicit file fallback; the Resolver
manager does not impose a universal classification ladder.

## Browser Handles and Rendering

Byte-oriented Resolvers may expose Blob or Object URL handles for image, audio, video, PDF, EPUB,
ZIP, and file content. Handles are private runtime state, never persisted solved-graph authority.
They are revoked on Resolver refresh, disposal, cache replacement, and eviction.

HTML remains source/text preview unless a separate sanitizer contract exists; it is not passed
directly to `v-html`. A parser-derived field may remain `null` when no proportionate browser parser
exists while open/render/download remains supported.

`BlockContent.vue` makes exact Resolver setup errors visible, obtains solved content, passes it to
the registered component, and disposes its Resolver on unmount. Graph and editor surfaces use this
path and never fall back to the persisted pointer string.

`ResolverCache` reuses instances by Block identity plus `updated_at` snapshot. Replacement,
targeted invalidation, and clearing dispose old instances. Resolver-local hydration, relation, and
solved-content caches still obey `refresh`; instance reuse does not change authority.

## Producer Guardrails

Producers emit exact, versioned Resolver IDs; keep protocol/source identity and declared metadata
in canonical metadata/root Blocks; put actual media or document bytes in a semantic content Block;
and represent associations with Relations. They never encode attachment identity into root
content or choose a semantic Storage type. Storage remains bytes-only mechanics.
