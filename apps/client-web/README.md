# Web Client of InKCre

## Deployment

`pnpm build` produces a static Vite artifact under `dist/`. Cloudflare Pages preview and production
automation is owned by the later CD slice; there is no application Worker or runtime config
endpoint.

## Development

Run from the monorepo root:

```bash
pnpm dev
pnpm dev:status
pnpm dev:stop
```

SVC and Portless allocate a stable URL for the current worktree. PostgREST URL, client ID, and the
user-owned JWT signing secret are configured in the browser; a fresh origin has no environment
default. The same environment-neutral static artifact is promotable through preview and
production. Config export deliberately excludes the secret.

本项目依赖 GitHub Packages 中的 `@inkcre/ui-web`。按照仓库根 `README.md` 配置只读 package token，并始终从 monorepo 根目录执行 frozen install；不要用 `pnpm link` 替代可复现依赖。
