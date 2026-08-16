# Components AGENTS.md

Read [/.github/instructions/component.instructions.md](/.github/instructions/component.instructions.md) first.

## Quick Reference

- peer: peerList, peerCard (product-facing copy may still say “client”)
- common: AppSidePanel
- extension: extensionCard, installExtension
- info-base: BlockNode, BlockDetailsPanel, resolvers/*
- obsrv: LogEntry, LogsViewer
- source: sourceCard, sourceForm
- job: JobCard

## Component Pattern

```
ComponentName/
├── ComponentName.vue   # Template & logic
├── ComponentName.ts    # Props, types
├── ComponentName.scss  # Styles
└── ComponentName.md    # Docs (optional)
```

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Component architecture
- [FILESYSTEM.md](./FILESYSTEM.md) - Directory structure
