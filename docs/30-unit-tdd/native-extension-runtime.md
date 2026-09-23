# Native Extension Runtime Unit

## Boundary

The native Extension Runtime spans the browser Web Extension Host, its SDK-owned durable models, and
independently versioned Module Federation producers. It owns compatibility preflight, executable
loading, runtime lifecycle, and reconciliation with durable enabled intent. Release publication,
Registry delivery, and deployment workflow remain outside this Unit TDD; cross-unit Extension and
Registry contracts remain in [`../_shared/`](../_shared/).

Resolver/content producer semantics belong to [Info-Base](info-base.md). Registry publication and
artifact delivery belong to
[First-party Extension Delivery](../40-deployment/native-extension-delivery.md).

There is one native format: an Extension Release may associate a Module Federation distribution.
The Host consumes that association directly. `@inkcre/extension-runtime-client-web`, maintained in
ext-reg, owns the Web Host and Registry consumers. `@inkcre/core` owns the shared models, Peer
transport, and browser configuration. There is no generic target matcher or cross-format artifact
manifest.

## Producer and Host Contract

Each producer is an independently versioned package. Its default export preserves the optional
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

The Runtime uses `ExtensionModel` from the shared `@inkcre/core` instance for installed state,
configuration, and per-Peer enabled intent. There is no application-owned `ExtensionStatePort` or
second PostgREST adapter. The application chooses the targeted Peers for each enable or disable
action: current-runtime operations use its local Host, online remote Hosts receive management
commands, and offline enablement changes update desired state through the SDK model. Selecting
several Peers performs independent per-Peer operations, preserves successful changes when another
Peer fails, then reads the canonical installed row before offering another decision. It does not
invent a batch transaction or retry an ambiguous remote outcome.

`listAdvertisedExtensionManagementPeers` and `manageExtensionOnPeer` in the Runtime own the shared
management capability contract. The latter delegates once to the exact Peer through the SDK's
`PeerManager`, validates the installed-row response, and preserves unknown outcomes. Consumers do
not retry mutations or choose a replacement Peer automatically. Response bodies are not included
in management errors because configuration validation may echo credentials.

Installed state records exact name and version plus the set of enabled Peer IDs. Registry Web owns
catalog search and version browsing; its link returns only a name and exact version to the
client-web Extensions page. Opening the link reads the published Release from this deployment's
configured Registry and shows a confirmation, but does not write installed state. Confirmation
uses the deployment-scoped Web Runtime install operation without selecting a Peer or requiring a
particular Host distribution. A Python-only Release can therefore be installed from the Web
interface. Installation does not enable either Host, and the shared version still affects every
Peer. Reopening an installed version does not silently change it; version changes remain an
explicit management operation.

Version change and uninstall are refused while any Peer remains enabled or a local runtime is
running. Startup reads canonical installed state and starts only entries enabled for the current
Peer. Shutdown stops volatile runtimes without changing durable enabled intent.

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
link opens the exact MF release's connection guide.

## Lifecycle and Compensation

The normal lifecycle is:

```text
load --> initialize --> activate --> deactivate --> dispose
```

The Host records a runtime as running only after initialization and activation finish. If either
start phase fails, it compensates through the available reverse lifecycle and preserves both the
original and cleanup failures when cleanup also fails. Stop deactivates only an active module and
then disposes it; disposal releases the loaded runtime.

Enable starts the exact runtime before adding the current Peer to durable enabled intent. If
persistence fails, the Host stops and removes that runtime. If the persisted version changed during
enable, the Host rolls back the just-added Peer intent and requires a retry against the new exact
Release.

Disable reverses the order: it stops the runtime before removing durable enabled intent. If state
persistence fails, it restarts the previous exact installed runtime to restore correspondence.
Combined failures retain both the persistence and compensation errors; they must not be flattened
into apparent success. Startup isolates failures per enabled extension, retains each runtime error
for inspection, and reports an aggregate after attempting the remaining entries.

## Invariants

- Canonical installed/enabled state is accessed through the shared SDK's `ExtensionModel`.
- Compatibility is proven before native executable fetch.
- The exact Release and native manifest association remain stable through one start attempt.
- Durable enabled intent and volatile runtime are reconciled with explicit compensation.
- Producer identity and lifecycle are native Module Federation contracts, not deployment scripts.
