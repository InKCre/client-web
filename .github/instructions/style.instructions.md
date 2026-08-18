---
applyTo: '**/*.scss, **/*.css, **/*.vue'
---

## Best Practices

- Use UnoCSS when style is simple (e.g. layout, animation)

### Use Design Tokens

Use design tokens by (auto injected, no import needed):

- using function `sys-var($path...)` for simple tokens (e.g. `background-color: sys-var(color, surface, base)`).
- using mixins `apply-font($size)`, `apply-icon($size, $centered: false)`, `apply-elevation($level)` for composite tokens.

Use only token names exported by the installed `@inkcre/ui-web` package. Never use reference
tokens directly.

### Naming

- Name selectors with BEM.
  - Make use of SCSS features like nesting, `&` and etc.
  - When there's more than 2 layer of elements, start a new block.

## Use icons

- You can use icon by adding class `i-mdi-<icon-name>`.
- Use `div` if not in a paragraph or text context, use `span` with `inline-block` if in a text context.
- Configure icon size and layout using `@include apply-icon($size, $centered: false)` mixin.
