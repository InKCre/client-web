# InKCre Client-Web

This is a Vue SPA, provides an interface to interact with InKCre (an information management tool).

## Tech Stacks

- Scaffold: Vue3 + TypeScript + Vite
- Routing: vue-router
- Internalization: vue-i18n
- State management: pinia
- Packagae management: pnpm

## Business Domains

- extension
- info-base
  - block
  - relation
  - storage
  - source
- sink

## Source Structure

- `components/`: split by domain
- `views/`
- `business/`: api requests, business logic, split by domain
- `stores/`: split by domain
- `styles/`
- `utils/`: utilities, composables
- `locales/`: locale file, split by language
- `static/`
- router.ts

## Best Practices

- Search across the codebase before you creating a new type or something might can be reused.
- Common components should be stateless or avoid maintaining state as much as possible.
- Read more in `.github/instructions/`
