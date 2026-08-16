# InKCre Client-Web Architecture

Client-Web is a static Vue application and an equal InKCre database Peer. “Client” remains the
product-facing name; code and technical documentation use **Peer** for the deployment identity used
by discovery and delegation.

## Topology

```text
Vue view/component
  ├─ database fact/query ──> domain Active Record ──> DBAPIClient ──> PostgREST/PostgreSQL
  └─ business capability ──> domain manager ──> PeerManager.delegate(exact capability)
                                      │
                                      └─ live Peer advertisement ──> protocol outbound
                                                                       │
                                                                       └─ provider inbound
                                                                            └─ local domain execution
```

The database and capability paths are intentionally separate. Client-Web does not have a generic
Core API client, a generic capability invoke endpoint, or a delegation job table.

## Technical Domains

- `info-base`: Block, Relation, Storage, Resolver, graph/list surfaces, and content hydration.
- `source`: source facts and collection-job visibility.
- `extension`: the native Web Extension Host, registry Release resolution, durable extension state,
  and local Module Federation lifecycle.
- `peer`: Peer Active Record, capability discovery, protocol outbounds, and one-shot delegation.
- `semantic-retrieval`: typed facade for `core.semantic_retrieval.v1`.
- `lexical-retrieval`: typed facade for `core.lexical_retrieval.v1`.
- `organization`: typed facade for `core.organization.rumination.v1`.
- `obsrv`: runtime logs and diagnostics.

## Peer Delegation

`PeerManager.delegate(capability, payload, routeToPeer)` discovers unexpired advertisements using
PostgreSQL time. An advertisement contains an exact capability ID plus one inbound interface:

```text
{
  id,
  inbound: {
    protocol,
    parameters
  }
}
```

The protocol selects a registered outbound. `core.peer.protocol.http.v1` carries normalized query,
headers, and optional JSON body; its static method and URL live only in inbound parameters. Peer JWT
authentication is part of that protocol. `routeToPeer` is caller-local routing state and never
enters the business payload.

Automatic failover is allowed only after explicit
`InkCre-Peer-Execution: not-executed`. Browser Fetch rejection cannot prove that dispatch did not
occur, so it becomes `PeerOutcomeUnknown` and is never retried automatically. Exact-target routing
never substitutes a different Peer.

## Domain Inbounds and Outbounds

Transport and business direction are different views of the same call:

- SemanticRetrievalOutbound is the caller-side `SemanticRetrievalManager` plus the selected Peer
  protocol outbound.
- LexicalRetrievalOutbound follows the same shape through `LexicalRetrievalManager`.
- Provider routes and their non-delegating local implementations form the matching domain inbounds.
- Organization rumination and Extension management follow the same direction model.

Domain managers own request and response models. PeerManager understands only exact capability
delegation and transport construction; it does not understand retrieval, organization, or
extensions.

## Configuration and Authentication

The static application initializes browser-local meta config before mounting Vue:

- PostgREST URL;
- current technical Peer ID (presented as Client ID in the UI);
- user-owned JWT signing secret.

The current Peer's deployment config is read from its database row and includes the Extension
Registry URL and Peer HTTP timeout. Static artifacts contain no deployment origin, Peer identity,
or JWT credential. JWTs are memory-only and use the generated Peer contract.

Local development runs core-py and PostgREST through the tracked database runtime. The deployment
orchestrator writes the core-py Peer's `config.http_public_base_url` through PostgREST, then waits
for exact capability advertisements and a live lease. The URL is not an environment-variable
authority.

## Native Web Extension Host

The Web Extension Host reads canonical installed-extension state through `ExtensionStatePort`.
Before Module Federation fetches executable bytes, it resolves the exact Registry Release and
checks its `@inkcre/core` compatibility range. It then owns the local lifecycle:

```text
initialize -> activate -> deactivate -> dispose
```

The browser extension view manages the current Peer. Cross-Peer extension execution remains an
exact delegated capability; it is not a generic Core API request path.

## Info-Base Navigation Hosts

GraphSurface and InfoBaseListView are InfoBase route-destination outlets. The list surface owns
lexical query/results and hosts BlockInspectorPopup and SolvedContentPopup without creating a
second browser-history authority. `InfoBaseRouter` is an application-bound singleton mapping
Block/Relation navigation to the current client's UI state.

BlockInspector exposes explicit rumination. Success reloads the active surface and reselects the
focal Block. `PeerOutcomeUnknown` is shown distinctly and is not retried or reported as success.

## Build Contract

- Vue 3, TypeScript, Vite, Pinia, Vue Router, Vue Flow, SCSS, and UnoCSS.
- `@inkcre/core` is source-aliased in workspace development and built as ESM by tsdown.
- The checked database contract generates relation types and Peer JWT/runtime metadata.
- The deployable output is an environment-neutral static artifact.

**Last Updated**: August 13, 2026
