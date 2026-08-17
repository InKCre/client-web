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

## Extension Capabilities

Extensions can register:

- Custom Resolvers for new content types
- Custom Storages for data retrieval
- UI components
- An optional Extension-owned setup component through the Web Host contribution contract

Setup contributions are runtime UI, not developer tooling or Host-owned wizard schemas. The
application may provide a popup surface, but the Extension owns its steps, commands, durable-fact
projection, and exit action.

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Extension architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [.agents/assets/vite.config.ts.md](./.agents/assets/vite.config.ts.md) - Vite config example
