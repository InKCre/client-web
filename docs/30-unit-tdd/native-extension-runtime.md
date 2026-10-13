# Native Extension Runtime Unit

## Boundary

The native Extension Runtime spans the browser Web Extension Host, its SDK-owned durable models, and
independently built Module Federation producers. It owns compatibility preflight, executable
loading, runtime lifecycle, and reconciliation with durable enabled intent. Release publication,
Registry delivery, and deployment workflow remain outside this Unit TDD; cross-unit Extension and
Registry contracts remain in [`../_shared/`](../_shared/).

Resolver/content producer semantics belong to [Info-Base](info-base.md). Registry publication and
artifact delivery belong to
[First-party Extension Delivery](../40-deployment/native-extension-delivery.md).

The browser supports the Module Federation native distribution. Registry v2 resolves an exact
`(name, module_federation, version)` release; other Peers independently select their native distributions. `@inkcre/extension-runtime-client-web`, maintained in
ext-reg, owns the Web Host and Registry consumers. `@inkcre/core` owns the shared models, Peer
transport, and browser configuration. There is no generic target matcher or cross-format artifact
manifest.

## Producer and Host Contract

Each producer is an independent build package; its package version owns its MF release. Its default export preserves the optional
native lifecycle methods `initialize`, `activate`, `deactivate`, and `dispose`; host-consumed
capabilities come from its package entry rather than playground bootstrap code. Extension code
imports `@inkcre/core` directly.

Each producer's `inkcre.module_federation.host_sdk_version` also supplies its native MF
`@inkcre/core` shared requirement. The build SDK version is not the consumer compatibility range:
an Extension may support more than one SDK minor. The artifact verifier requires both ranges to be
semantically equal and to accept the build SDK. SDK sharing remains a Host-only singleton, without
a bundled fallback. UI compatibility is declared independently and is not implied by the SDK range.

Host 与 Web 扩展通过现有 Module Federation 配置共享 `@inkcre/ui-web` 单例，
并声明当前锁定 UI 版本的要求。UI 的 i18n、路由和表单上下文使用模块内的 Vue 注入 key；
如果扩展另用一份 UI 运行时，即使外观相同，也无法继承 Host 的这些上下文。
独立 playground 仍可使用包自身的 fallback 模块，样式由各自应用入口加载。

The producer emits the native `mf-manifest.json`, Remote entry, and referenced shared/exposed asset
closure with relative asset semantics. The Registry Release records an immutable manifest
association and typed Host SDK association. These are runtime inputs to the Host, not a second
manifest invented by the client.

Before fetching executable bytes, the Host reads the exact Release, requires an associated Module
Federation distribution, requires `host_sdk === '@inkcre/core'`, and verifies that its strict local
SDK version satisfies the Release range. Installation requires a published Release; an already
installed exact yanked Release may start with a warning, while other non-executable states fail.
The Registry reader resolves the association to a trusted Registry-hosted URL, which the Host
passes directly to the current native Module Federation implementation.

## Durable State and Peer Intent

The shared `ExtensionModel` owns one deployment identity, display name and configuration. Business
state remains deployment-scoped and is never cleared by native version changes. The
`ExtensionParticipationModel` owns each `(name, peer_id)` selection: exact distribution/version,
enabled intent and configuration schema from that exact selection. No global package version or
shared enabled array remains writable.

The Extension card displays a single plugin with a row for each Peer. Installation and version
changes explicitly target that row. The current browser uses its local Host; an online remote Peer
uses `core.extension.management.v2`; offline operations update an existing exact participation.
A new remote installation requires a real supported-distribution observation. Peer names and
application versions do not imply format support. Missing MF releases remain unavailable choices;
a Python-only plugin does not get a failing browser enable action.

Management responses contain supported distributions and actual loaded versions, running state,
restart requirements and errors. Database enabled intent is not proof that a sleeping Peer is running.
The consumer sends each mutation once to its exact target and preserves unknown outcomes. It does
not retry mutations on another Peer. Configuration forms identify the selected Peer/distribution/
version that provided their schema; shared configuration has no global last-started schema.

Registry installation links carry `name`, `distribution` and exact `version`. Opening a link only
reads the release and presents the target Peer choice; confirmation persists that exact target's
selection without enabling it. Startup reads only current-Peer enabled selections and never follows
latest. Legacy records with unresolved distribution retain their exact version until the upgraded
Host resolves its own native format. A missing release requires an explicit replacement selection.

Removing a participation requires it to be disabled and does not remove the plugin's shared identity,
configuration, authorization state, Sources or info-base content. Another Peer's selection is unchanged.

## Documentation and Memos Connection

Extension cards discover documentation independently of executable preflight or enablement.
They resolve the existing Registry origin and read documentation for the exact installed name and
version through the Runtime's `getExtensionDocumentation`. Only returned global, python, and
module-federation links appear. Missing documents and temporarily unavailable discovery are
different states; neither prevents Extension operations. Links open without credentials or an
opener, and the application does not fetch or embed document bodies.

The Memos setup contribution owns connection preparation. An explicit action reuses a saved PAT or
generates one with browser cryptographic randomness, saves it through `patch_config`, and enables
the selected Core only if it is not already enabled. Online plus enabled is the normal best-effort
runtime assumption. The contribution obtains the complete server URL from `memos.connection.v1`;
it does not read Peer configuration or construct a Memos route. Address-read failures preserve the
saved token and enabled state. Opening, selecting, and refreshing only read state. Unknown mutation
outcomes require refreshing before another attempt. The PAT is masked by default; a normal help
link opens the current browser participation's exact MF release connection guide.

The Twitter setup contribution selects an authorization Peer for OAuth requests and callbacks. It
can open from the browser's running MF distribution before the selected Peer has installed Twitter;
an explicit enable action selects an available Python release when no pin exists, then enables that
Peer. Existing exact selections are not replaced by that action. Source, Cron and collection Jobs
remain shared deployment records; choosing the authorization entry does not bind their future
execution to that Peer. The interface does not call this a collection-Peer binding or attribute its
schedule timezone to the selected OAuth entry.

## Lifecycle and Compensation

The normal lifecycle is:

```text
load --> initialize --> activate --> deactivate --> dispose
```

The Host records a runtime as running only after initialization and activation finish. If either
start phase fails, it compensates through the available reverse lifecycle and preserves both the
original and cleanup failures when cleanup also fails. Stop deactivates only an active module and
then disposes it; disposal releases the loaded runtime.

Enable starts the exact runtime before setting that participation’s enabled intent. If
persistence fails, the Host stops and removes that runtime. If the persisted version changed during
enable, the Host rolls back that participation’s enabled intent and requires a retry against the new exact
Release.

Disable reverses the order: it stops the runtime before removing durable enabled intent. If state
persistence fails, it restarts the previous exact installed runtime to restore correspondence.
Combined failures retain both the persistence and compensation errors; they must not be flattened
into apparent success. Startup isolates failures per enabled extension, retains each runtime error
for inspection, and reports an aggregate after attempting the remaining entries.

The Client Web shell opens database views before native Extension restore finishes. A cold deep link can therefore encounter an unregistered Extension resolver. The content popup retries that specific lookup failure after the Host completes restore, while preserving other read failures. Extension cards wait for the same restore before observing current-Peer runtime status; a persisted enabled intent alone does not establish that the module is running.

A restore attempt isolates module failures. Completing the attempt, including an aggregate failure, allows registered resolvers to serve content and exposes each module’s actual status; an unknown resolver after that attempt remains a visible error.

## Invariants

- Shared identity/configuration and per-Peer native selection have separate SDK models.
- Compatibility is proven before native executable fetch.
- The exact Release and native manifest association remain stable through one start attempt.
- Durable enabled intent and volatile runtime are reconciled with explicit compensation.
- Producer identity and lifecycle are native Module Federation contracts, not deployment scripts.
