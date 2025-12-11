---
applyTo: "**/*.scss, **/*.css, **/*.vue"
---

## Best Practices

- Use UnoCSS when style is simple (e.g. layout, animation)

### Use Design Tokens

Use design tokens by:

- use function `sys-var(...keys)` for simple tokens (e.g. `background-color: sys-var(color, surface, base)`).
- use mixins `apply-font($size)`, `apply-icon($size, $centered: false)`, `apply-elevation($level)` for composite tokens.

Read token list [here](docs/tokens.md)

Never use reference tokens directly.

### Naming

- Use BEM with SCSS features like nesting, `&`, etc.
  - When there's more than 2 layer of elements, start a new block.

## Use icons

- You can use icon by adding class `i-mdi-<icon-name>`.
- Configure icon size and layout using `pu-icon` mixin.
