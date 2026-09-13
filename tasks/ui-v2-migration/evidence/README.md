# UI 2.0 消费验收

Web、mail、twitter 和 ext-dev-utils 均锁定 GitHub Packages 的 `@inkcre/ui-web@2.0.0`；这些检查没有启用源码映射或 `file:` 依赖。截图使用隔离数据，不含用户业务内容或真实凭据。

## 通过的边界

完整 `pnpm check` 覆盖格式、lint、类型、Core/Web/WXT/两个扩展构建与产物契约。另通过源码联调类型检查、TS7、两个扩展的原生 manifest 检查、Intent load 和 Chromium 扩展 popup E2E。PR #104 的 [首轮完整 CI](https://github.com/InKCre/client-web/actions/runs/34739437023) 使用真实 core 服务与隔离数据库，通过五个 Web 旅程，包括新增的 Peer JSON 保存。后续 MF 与布局修改继续由 PR 当前提交的 checks 验证。

实际构建的 Web 页面验证了 JSON 语法／schema 无效时禁用保存、保存后的草稿回显、中英文切换和深浅主题。375px 下 Peer dialog 位于视口内，未发生运行时异常。持久化失败、pending 禁止关闭、禁用编辑与重试成功由真实数据库 E2E 证明。

[扩展验收脚本](browser-host.mjs) 从真实 Web 构建进入 Extensions，按原生 manifest 加载本次构建的 mail 和 twitter，网络边界使用隔离 Registry／Peer／Block 数据。它验证中文 Host 的小时／分钟、取消／确认文案传入 Twitter；取消保留原时间，确认提交 07:30；再进入 Info-Base 的 Mail renderer，验证 HTML 隔离显示、附件下载 pending、受控 HTTP 500 后错误显示与按钮恢复。最终未出现 pageerror；控制台的 500 属于主动失败注入。它不证明真实 OAuth 或 Mail 服务集成，这些操作没有执行。

## 复跑

在工作区根目录完成 `pnpm install --frozen-lockfile` 和 `pnpm check`，随后分别运行：

```sh
pnpm --filter @inkcre/client-web preview --host 127.0.0.1 --port 47931 --strictPort
node tasks/ui-v2-migration/evidence/browser-host.mjs http://127.0.0.1:47931
```

脚本依赖仓库已有 Playwright 和 Chromium，输出截图到忽略的 `.runtime/ui-migration-evidence/`。它是这次验收的重放夹具，没有建立第二套发布或测试框架。数据库验证仍运行根级 `pnpm test:e2e:web`；本机 SSH provider 当次不可达，该项使用 PR 的既有隔离数据库 CI。

## 代表截图

- [Peer 深色窄屏配置](peer-config-narrow.png)：有效草稿可以保存，界面留在视口内。
- [Twitter 继承 Host 中文](twitter-time-picker.png)：真实 MF remote 使用共享 UI 的日期文案。
- [Mail 窄屏附件和失败反馈](mail-host-dark-narrow.png)：附件行换行，下载按钮保持完整。

最终构建目录按相对路径排序，依次拼接「路径、NUL、文件内容、NUL」计算 SHA-256，包含 source maps：

| 产物                    | 文件数 | SHA-256                                                            |
| ----------------------- | ------ | ------------------------------------------------------------------ |
| Web dist                | 11     | `9ca534eebec790abd9f18ebd70e2ea996fc47a8ca559140fb66fdc87f88f652d` |
| mail dist/client-web    | 43     | `c040be803eabcb387c9880a1b9a16985259b68574cd2a202e92eb8b58f5d5ee9` |
| twitter dist/client-web | 47     | `0baae6f0a4030c8bf6f7a9ecdac72139a02eb928af3ef8fc12f564c102864474` |
