# Client Runtime and Delegation

## Boundary

Client-Web is an environment-neutral static Vue application and an equal database-protocol Peer.
It reads and writes admitted PostgreSQL facts through PostgREST and delegates business capabilities
through exact Peer advertisements. These are separate paths: there is no generic Core API client,
generic capability endpoint, or delegation job table.

Shared capability envelopes, database admission, and JWT claims are cross-unit contracts owned by
[`../_shared/20-product-tdd/`](../_shared/20-product-tdd/). This document owns their browser-Peer
realization.

Info-Base interpretation belongs to [Info-Base](info-base.md); native Extension loading belongs to
[Native Extension Runtime](native-extension-runtime.md).

```text
Vue surface
  |-- database fact --> domain Active Record --> DBAPIClient --> PostgREST
  `-- command -------> domain manager --> PeerManager --> protocol outbound --> provider inbound
```

Domain managers own typed request and response models. `PeerManager` knows only capability IDs,
advertisements, candidate selection, and protocol outbound construction; it must not acquire
retrieval, organization, or extension semantics. Provider inbounds invoke non-delegating local
domain implementations so a received command cannot accidentally delegate in a loop.

## Exact Delegation and Outcome Safety

`PeerManager.delegate(capability, payload, routeToPeer)` discovers other Peers whose database lease
is live according to PostgreSQL time and whose advertisement contains the exact capability plus one
registered inbound protocol. `routeToPeer` is caller-local routing state and never enters the
business payload. Without an exact target, eligible candidates may be tried in shuffled order;
with one, no other Peer may be substituted.

The built-in `core.peer.protocol.http.v1` outbound takes its method and absolute HTTP(S) URL only
from validated inbound parameters. The command envelope may carry normalized query values, allowed
headers, and optional JSON body. The outbound rejects transport-owned headers and adds the current
Peer JWT itself.

Failover is safe only when the provider explicitly returns
`InkCre-Peer-Execution: not-executed`. A Fetch rejection can happen after dispatch, and an unreadable
response happens after dispatch, so both produce `PeerOutcomeUnknown`. That outcome is terminal:
the manager must not retry it, the UI must distinguish it from ordinary failure, and callers must
not report it as success. A malformed response after a readable dispatch is a protocol error, not
proof of non-execution.

## Browser Configuration and JWT

Before Vue mounts, the browser initializes three bootstrap values owned by the current browser
origin:

- PostgREST base URL;
- current technical Peer UUID (presented as Client ID only in product-facing UI);
- user-owned JWT signing secret.

The selected Peer's database row supplies deployment configuration such as Extension Registry URL
and Peer HTTP timeout. The static artifact contains no environment origin, Peer identity, secret,
Worker, or runtime-config endpoint fallback.

The signing secret is masked in UI, excluded from logs and portable exports, and retained only in
browser-owned runtime state. Signed JWTs are memory-only. The auth store derives algorithm,
issuer, audience, role, and maximum lifetime from the generated Peer runtime contract, regenerates
the token when the secret changes, and clears it when the secret is removed. PostgREST JSON access,
raw byte access, and Peer HTTP delegation reuse this single authentication authority.

The browser signer backdates `iat` by five seconds and derives `exp` from that adjusted value. This
absorbs ordinary sub-second or small deployment clock skew at the authentication boundary without
increasing the shared maximum lifetime or leaking retries into PostgREST/domain callers.

## Application Hosts

`InfoBaseRouter` is an application-bound singleton translating Block and Relation navigation into
the current Vue UI state. `GraphSurface` and `InfoBaseListView` are route destinations; nested Block
inspectors and solved-content popups remain hosted by the active surface instead of creating a
second browser-history authority.

Explicit rumination reloads the active surface and reselects the focal Block only after confirmed
success. `PeerOutcomeUnknown` remains visible and does not trigger reload or automatic retry.

## Invariants

- Technical contracts say **Peer** even where the product UI says **client**.
- Database facts and capability commands remain distinct paths.
- Exact-target routing never degrades to best-effort routing.
- Ambiguous dispatch is never retried automatically.
- Browser bootstrap state is runtime authority; portable build bytes stay environment-neutral.
