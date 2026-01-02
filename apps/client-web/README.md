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

本项目依赖 `@inkcre/web-design` 包，本地开发时推荐通过 `pnpm link path/to/package` 的方式安装。
