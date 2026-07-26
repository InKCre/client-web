# Filesystem Structure

## Root

```
.
├── .agents/              # AI agent prompts and assets
│   ├── prompts/          # Reusable prompt templates
│   └── skills/
│       └── svc/          # Generated SVC CLI operating skill
├── .github/
│   ├── agents/           # GitHub Copilot agent definitions
│   ├── instructions/     # Copilot instructions by context
│   └── workflows/        # CI/CD workflows
├── apps/
│   ├── client-web/       # Main web application
│   └── client-webext/    # Browser extension
├── docs/
│   ├── index.md          # Local documentation and SVC navigation
│   ├── _shared/          # Read-only InKCre/docs Hub submodule
│   └── ...               # Local architecture notes and historical plans
├── extensions/           # Module Federation remotes
├── packages/
│   ├── core/             # Shared logic package
│   └── ext-dev-utils/    # Extension dev utilities
├── runtime/
│   └── database.compose.yml # Portable local/SSH database topology
├── scripts/              # Doctor, contracts, provider transports, launchers, and cleanup
├── tasks/                # Active agent-owned task packets
├── .oxfmtrc.json         # Repository Oxfmt contract
├── .oxlintrc.json        # Repository Oxlint contract
├── AGENTS.md             # This repo's agent guide
├── ARCHITECTURE.md       # System architecture
├── FILESYSTEM.md         # This file
└── svc.json              # Committed SVC adoption and dev-capability contract
```

Ignored worktree-local state is partitioned by responsibility:

```
.runtime/
├── database/<instance>/  # Runtime identity, Compose env, profile, and credentials
├── dev/<instance>/       # Optional isolated Chromium profile
└── ssh/<instance>        # OpenSSH control socket for the remote Docker provider
```

The database files and SSH socket are mode-restricted and removed by the bounded stop path. WXT
uses its isolated profile only when an explicit browser binary is configured.

## packages/core/src/

```
├── auth/           # Authentication store
├── base/           # DBAPIClient, base utilities
├── client/         # Client model & API
├── config/         # Configuration adapters & schema
├── extension/      # Extension lifecycle, Module Federation
├── info-base/      # Block, Relation, Storage, Resolvers
├── libs/           # Third-party integrations (AI)
├── obsrv/          # Observability (logging)
├── sink/           # Output processing (graph layouts)
├── source/         # Source, CollectJob, CollectAt
├── utils/          # Vue prop helpers, utilities
├── index.ts        # Package exports
└── ../tsdown.config.ts # ESM library build and declaration contract
```

## apps/client-web/src/

```
├── components/     # Vue components by domain
│   ├── client/     # Client management
│   ├── common/     # Shared components
│   ├── extension/  # Extension UI
│   ├── info-base/  # Block, Relation, Graph
│   ├── obsrv/      # Log viewer
│   └── source/     # Source management
├── composables/    # Vue composition functions
├── locales/        # i18n translations
├── static/         # Static assets
├── storages/       # App-specific storage
├── styles/         # Global SCSS
├── utils/          # App utilities
├── views/          # Route views
├── App.vue         # Root component
├── core.ts         # Core initialization
├── main.ts         # Entry point
└── router.ts       # Vue Router config
```

## apps/client-webext/

```
├── components/     # Shared Vue components
├── composables/    # Composition functions
├── entrypoints/    # WXT entry points
│   ├── background.ts
│   ├── content/
│   ├── popup/
│   ├── options/
│   ├── sidepanel/
│   ├── explain.sidepanel/
│   └── taking-note.sidepanel/
├── logic/          # Business logic
├── styles/         # SCSS styles
└── wxt.config.ts   # WXT configuration
```

## extensions/<id>/

```
├── src/
│   ├── index.ts    # Federation module entry
│   └── main.ts     # Dev playground entry
├── package.json
├── vite.config.ts  # Module Federation config
└── tsconfig.json
```

## Component File Convention

Each component folder follows:

```
ComponentName/
├── ComponentName.vue   # Component implementation
├── ComponentName.ts    # Types/props
├── ComponentName.scss  # Styles
├── ComponentName.md    # Documentation (optional)
└── ComponentName.spec.ts # Tests (optional)
```
