# Native Extension Runtime Unit

## Boundary

The native Extension Runtime spans the browser Web Extension Host, its durable state port, and
independently versioned Module Federation producers. It owns compatibility preflight, executable
loading, runtime lifecycle, and reconciliation with durable enabled intent. Release publication,
Registry delivery, and deployment workflow remain outside this Unit TDD; cross-unit Extension and
Registry contracts remain in [`../_shared/`](../_shared/).

Resolver/content producer semantics belong to [Info-Base](info-base.md). Registry publication and
artifact delivery belong to
[Native Extension Delivery](../40-deployment/native-extension-delivery.md).

There is one native format: an Extension Release may associate a Module Federation distribution.
The Host consumes that association directly. There is no shared Extension Runtime/API package,
generic target matcher, or canonical cross-format artifact manifest.

## Producer and Host Contract

Each producer is an independently versioned package. Its default export preserves the optional
native lifecycle methods `initialize`, `activate`, `deactivate`, and `dispose`; host-consumed
capabilities come from its package entry rather than playground bootstrap code. Extension code
imports `@inkcre/core` directly.

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

`ExtensionStatePort` is the semantic boundary for listing, reading, installing, changing version,
updating configuration, setting per-Peer enabled intent, and uninstalling. It deliberately hides
SQL, PostgREST routes, and generated relation types. The PostgREST adapter is one implementation,
not the Host contract.

Installed state records exact name and version plus the set of enabled Peer IDs. The browser view
selects the Host that validates installation or version changes. The current browser uses its
Module Federation Host; an online Core uses `core.extension.management.v1` with the exact Release
coordinate and validates its Python distribution. A Python-only Release therefore does not need
a browser distribution to be installed from the Web interface. Installation does not enable either
Host, and the shared version still affects every Peer. Offline Peers cannot validate an installation
or version change; the view must not silently redirect it to a different Host. Cross-Peer management
is an exact delegated capability, not a generic Core API call.

Version change and uninstall are refused while any Peer remains enabled or a local runtime is
running. Startup reads canonical installed state and starts only entries enabled for the current
Peer. Shutdown stops volatile runtimes without changing durable enabled intent. Host operations are
serialized so concurrent UI commands cannot interleave lifecycle and persistence transitions.

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

- Canonical installed/enabled state is accessed only through `ExtensionStatePort`.
- Compatibility is proven before native executable fetch.
- The exact Release and native manifest association remain stable through one start attempt.
- Durable enabled intent and volatile runtime are reconciled with explicit compensation.
- Producer identity and lifecycle are native Module Federation contracts, not deployment scripts.
