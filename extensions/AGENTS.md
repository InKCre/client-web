# Extensions AGENTS.md

Module Federation remotes extending InKCre functionality.

## Structure

Each subfolder is a standalone extension. Folder name = extension ID.

```
extensions/
├── twitter/              # Example extension
│   ├── src/
│   │   ├── index.ts      # Federation entry (exports)
│   │   └── main.ts       # Dev playground entry
│   ├── vite.config.ts    # MF config
│   ├── tsconfig.json
│   └── package.json
└── mf-shared.ts          # Shared dependencies
```

## Required Files

- `src/index.ts` - Federation module entry, exports resolvers/storages
- `src/main.ts` - Development playground
- `vite.config.ts` - Module Federation configuration
- `package.json` - Extension dependencies, identity, Release, and Host SDK association

Production builds emit a native `mf-manifest.json`. Keep `base: './'`; Registry publication
materializes its `metaData.publicPath` for the immutable public Release prefix.

## Commands

```bash
pnpm dev      # Dev server with HMR
pnpm build    # Build for production
```

## Release Intent

- Add a conflict-resistant fragment with `pnpm changeset`; select only independently releasable
  Extension packages affected by the change.
- Pending changesets are the release plan input. The Extension Release workflow maintains one
  Version PR that consumes them and updates affected package versions and changelogs.
- Once that Version PR is merged and no pending changesets remain, the same workflow runs the
  idempotent custom Registry publisher. The release workflow checks out the release revision and
  builds native Extension artifacts itself; it never consumes CI workflow artifacts.
- Do not edit generated version/changelog state separately. Pages deployment is an independent app
  lifecycle and never publishes Extensions.

## Extension Capabilities

Extensions can register:

- Custom Resolvers for new content types
- Custom Storages for data retrieval
- UI components

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Extension architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [.agents/assets/vite.config.ts.md](./.agents/assets/vite.config.ts.md) - Vite config example
