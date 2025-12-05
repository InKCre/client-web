---
applyTo: "**/*.scss, **/*.css, **/*.vue"
---
  
## Best Practices

### Use Design Tokens

- Design tokens are provided through CSS variables, and maintained in `@inkcre/web-design` package.
- Token naming scheme: `<level>-<category>-<type>-<item>`, e.g. `sys-color-surface-base`.
- There's three layers of design tokens:
  - Reference token: magic value, no semantic meaning, categorized into:
    - color: neutral, primary, secondary, tertiary, danger
    - space
    - radius
    - opacity
    - breakpoint
    - elevation
  - System token: semantic tokens, reference of reference tokens
    - color: surface, text, border
    - typo(graphy): family
    - font: label, body, title, heading, display, each with sm, md, lg size variants
  - Component token: allows easily customize components, only common components have component tokens
- Use `sys-var(...keys)` function for simple tokens and `apply-font($size, $mono: false)`, `apply-icon($size, $centered: false)` mixins for composite tokens. Never use reference tokens directly.

### Naming

- Use BEM with SCSS features like nesting, `&`, etc.

## Use icons

- You can use icon by adding class `i-mdi-<icon-name>`.
- Configure icon size and layout using `pu-icon` mixin.