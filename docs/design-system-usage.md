# Design System Usage Guide

This guide summarizes how to consume the design system that implements the CTI+S design token model described in `docs/Design Token 管理方案设计.md`. It focuses on day-to-day usage rather than implementation details.

## Token layers and source files
- **Reference tokens** live in `src/styles/scss/abstract/_ref.scss` as top-level maps (`$palette`, `$font`, `$space`, `$shape`, `$elevation`, `$opacity`, `$layout`) that expose raw primitives.
- **Typography tokens** are defined in `src/styles/scss/abstract/_typography.scss` as `$typo-tokens`, hard-encoding sizes/line-heights/weights while reusing the reference font families.
- **Semantic system tokens** reside in `src/styles/scss/abstract/_semantic.scss` as `$light` and `$dark` maps, producing `--sys-` CSS variables for light and dark themes.
- **Component tokens** are registered alongside the semantic map in `src/styles/scss/abstract/_semantic.scss` as `$component-tokens` and emitted as `--comp-` variables for component-level overrides.

The entry file `src/styles/scss/index.scss` emits all CSS custom properties and sets up defaults such as `color-scheme`.

## Consuming tokens in SCSS
1. Import the shared entry once globally (already done in `src/main.ts` via `@/styles/main.scss`).
2. In component styles, access tokens through CSS custom properties or the provided helpers:
   - **Direct variables:** `var(--sys-color-surface-bg-base)`, `var(--sys-space-scale-md)`, etc.
  - **Helper functions:** `@use '@/styles/scss/abstract/functions' as fn;` then call `fn.sys-var('color', 'content', 'text', 'primary')` or `fn.comp-var('button', 'md', 'padding')` to keep paths readable.
  - **Mixins:** `@use '@/styles/main.scss' as *;` forwards `src/styles/scss/mixins.scss` so you can apply primitives like `@include button-primitive` or responsive helpers such as `@include mobile { ... }` without extra plumbing.

Keep overrides semantic: prefer system tokens over raw reference values so theme adjustments cascade automatically.

## UnoCSS integration
- `uno.config.ts` reads the same system CSS variables to drive the UnoCSS theme (colors, spacing, radii, shadows, typography). Utility classes automatically stay in sync with SCSS tokens.
- Shortcuts like `app-shell` and `card-surface` are available for common layouts. Additional utilities can be composed as usual with UnoCSS presets.
- Global preflight keeps `color-scheme` aligned with the emitted variables; prefer CSS variables over hard-coded values when authoring new shortcuts.

## Theming behavior
- Both light and dark semantic token sets are emitted; user preference (`prefers-color-scheme`) selects the active set automatically.
- If you need component-specific overrides, register them under `$component-tokens` so they are emitted as `--comp-...` variables and reference them with `fn.comp-var`.

## Migration notes
- Align new work to `--sys-...` variables or helper functions (`fn.sys-var`) to avoid future breaking changes.
- Avoid importing old styling utilities; the SCSS entry and UnoCSS theme are now the single sources of truth for design tokens.
