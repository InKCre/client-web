Token naming:

- following scheme `<layer>-<category>-<type>-<item>` (e.g. `sys-color-surface-base`.)
- there's three layers of design tokens: `ref`, `sys`, `comp`
- categories: `color`, `typo`, `font`, `space`, `radius`, `opacity`, `breakpoint`, `elevation`
- types:
  - color: ``
- System token: semantic tokens, reference of reference tokens
  - color: surface, text, border
  - typo(graphy): family
  - font: label, body, title, heading, display, each with sm, md, lg size variants
- Component token: allows easily customize components, only common components have component tokens
