# Plan: Resolver Registry Consolidation

## Observations

- The current resolver flow uses a dedicated `ResolverManager` singleton exported as `resolverManager`, which is imported by resolver classes, extensions, and UI components (e.g., `BlockContent.vue`).
- Every resolver implementation currently decorates with `@ResolverManager.registry(...)` and `BlockContent` calls `resolverManager.getClass(...)`, so switching to a static registry on `Resolver` affects several entry points.
- Aggregation modules (`packages/core/src/info-base/resolvers/index.ts`, `info-base/index.ts`, and `packages/core/src/index.ts`) re-export `ResolverManager`/`resolverManager`, so the public API will need updating once the standalone manager is removed.

## Proposed Steps

1. Expand `Resolver` itself into the registry singleton by introducing static `resolverClasses` and `defaultResolverType` maps plus methods such as `register`, `registry`, `getClass`, `setDefault`, and the other helpers currently on `ResolverManager`. Log registration and keep the existing default-fallback semantics.
2. Update every core resolver (`text`, `image`, `html`, `video`) and the Twitter extension resolver to use `@Resolver.registry(...)`/`Resolver.register` instead of `ResolverManager`, dropping the separate manager import.
3. Replace all remaining uses of `resolverManager`/`ResolverManager` (re-exports in `info-base` and root entrypoints, the Twitter extension entry point, `BlockContent.vue`, etc.) to call the new static API (`Resolver.getClass`) and stop exporting the old singleton.
4. Refresh documentation (e.g., `docs/info-base/ARCHITECTURE.md`) to explain the static registry on `Resolver` instead of `ResolverManager`.

## Questions

- Should we keep any backwards-compatible exports (e.g., re-exporting `ResolverManager` as an alias)? The request says "remove resolverManager," so I'm assuming no compatibility layer is desired.
- Anything else that consumes the current manager that we might have missed and should keep in mind?
