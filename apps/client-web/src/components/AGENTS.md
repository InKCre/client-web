# Component Subtree Instructions

Scope: `apps/client-web/src/components/**`.

## Hazards and Owners

- Domain contracts belong to `@inkcre/core` or the owning application domain. Do not create a
  component-local copy of a model merely to shape props or emits.
- Solved-content renderer selection belongs to the core `Resolver` registration. Keep
  `SolvedContentRenderer` as a dynamic handoff; do not add a second resolver-to-component map here.
- Keep technical names under `peer/`; user-facing copy may use “client”.

General component file guidance lives in
[component.instructions.md](../../../../.github/instructions/component.instructions.md). Stable
runtime and Info-Base semantics belong to `../../../../docs/30-unit-tdd/`.

## Checks

- Run `pnpm --filter @inkcre/client-web type-check` after changing component contracts or Vue code.
- Run `pnpm --filter @inkcre/client-web test` when changing behavior covered by component specs.
