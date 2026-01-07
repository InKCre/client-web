# @inkcre/client-web Development Guideline

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm type-check       # TypeScript check
```

## Joint dev with extensions

TODO

## Joint dev with @inkcre/web-design

```bash
cd /path/to/local/web-design
pnpm link --global
```

```bash
cd /client-web/apps/client-web
pnpm link --global @inkcre/web-design
```
