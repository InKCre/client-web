# InKCre Web Client

第三尺寸网页客户端

## Deployment

### Cloudflare Worker

```bash
pnpm run deploy:cf
```

执行该命令时：

- Vite 将载入 `.env.cloudflare` 文件定义的环境变量
- 编译和打包到 `dist/`
- 部署到 Cloudflare Worker

## Documentation

- Design token proposal: [`docs/Design Token 管理方案设计.md`](docs/Design%20Token%20%E7%AE%A1%E7%90%86%E6%96%B9%E6%A1%88%E8%AE%BE%E8%AE%A1.md)
- Design system usage: [`docs/design-system-usage.md`](docs/design-system-usage.md)
