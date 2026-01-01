# InKCre Client-Web

InKCre is an information management application aims to provides automatic information collection, organization and powerful use of information.
And this is the Web client of InKCre, mainly provides a GUI to manage the system, but also provides some sinks.

## Tech Stacks

- Framework: Vue3 + TypeScript + SCSS
- UI Library: `@inkcre/web-design` (Agent Skill provided)
- Routing: vue-router
- Internalization: vue-i18n
- Date and time: dayjs
- State management: pinia

## Business Domains

- source: Data collectors, the input of info-base
- info-base: graph based
  - block: Info unit
  - relation: Links between blocks
  - storage: Store block content somewhere else than database.
  - resolver: resolves a block's star graph
- sink: use of information base, the output of info-base
- extension: extends info-base, source and sink abilities
- client
- obsrv: Observability

## Source Structure

- `components/`: split by domain, read `components/AGENTS.md` for more.
- `views/`: pages, split by domain
- `business/`: api, business logic, split by domain
- `stores/`: split by domain
- `styles/`
- `utils/`: utilities, composables
- `locales/`: locale file, split by language
- `static/`
- `router.ts`

## Development Workflow

- Package Manager: pnpm
- Verify changes:
  - Pass the build: `pnpm run build`

## Coding Guidelines

- Do not repeat yourself:
  - Search across the codebase before you creating a new type or something might can be reused.
  - Make the code reusable if it's used in over two places.
- [Write code for human](./.github/instructions/human-readable-code.instructions.md)
