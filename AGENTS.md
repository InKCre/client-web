# InKCre Client-Web

InKCre is an information management application aims to provides automatic information collection, organization and powerful use of information.
And this is the Vue implemetation of InKCre, mainly provides a GUI to manage info-base and use information.

## Tech Stacks

- Framework: Vue3 + TypeScript + SCSS
- UI Library: `@inkcre/web-design` (Read doc in `node_modules/@inkcre/web-design/agent-skills`)
- Routing: vue-router
- Internalization: vue-i18n
- Date and time: dayjs
- State management: pinia

## Business Domains

- source: Data collectors, the input of info-base
- info-base
  - block: Content units
  - relation: Links between blocks
  - storage: Store block content somewhere else than database.
  - resolver: resolves block content
- sink: Interface to use information base, the output of info-base
- extension: extends info-base, source and sink abilities
- obsrv: Observability

## Source Structure

- `components/`: split by business domain
- `views/`
- `business/`: api requests, business logic, split by domain
- `stores/`: split by domain
- `styles/`
- `utils/`: utilities, composables
- `locales/`: locale file, split by language
- `static/`
- `router.ts`

## Coding Guidelines

- Do not repeat yourself:
  - Search across the codebase before you creating a new type or something might can be reused.
  - Make the code reusable if it's used in over two places.
- [Write code for human](./.github/instructions/human-readable-code.instructions.md)

## Deployment

This project supports following deployments:

- Cloudflare Worker
- Build and serve
