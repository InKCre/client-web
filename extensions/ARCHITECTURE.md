# Architecture of InKCre Web Extensions

- An Extension Release may associate one native Module Federation Distribution.
- The producer emits `mf-manifest.json`, the Remote entry, and referenced shared/exposed assets.
- The producer keeps Vite `base: './'`; Registry admission validates the native closure and
  materializes only `metaData.publicPath` to the immutable public Release prefix.
- The Web Host reads the exact Release descriptor, checks its `@inkcre/core` range, then passes the
  Registry-hosted native manifest URL directly to the current Module Federation Host.
- The Remote default export preserves `initialize`, `activate`, `deactivate`, and `dispose`.
- Extension code imports and uses `@inkcre/core` directly. There is no shared Extension Runtime/API
  package, generic target matcher, or canonical cross-format artifact manifest.
- `package.json` owns the Extension Name/Nickname, Release version, and typed native Host SDK
  association used by checked publication automation.
