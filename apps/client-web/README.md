# Web Client of InKCre

## Deployment

### Cloudflare Worker

```bash
pnpm run deploy:cf
```

执行该命令时：

- Vite 将载入 `.env.cloudflare` 文件定义的环境变量
- 编译和打包到 `dist/`
- 部署到 Cloudflare Worker

## Development

本项目依赖 GitHub Packages 中的 `@inkcre/web-design`。按照仓库根 `README.md` 配置只读 package token，并始终从 monorepo 根目录执行 frozen install；不要用 `pnpm link` 替代可复现依赖。
