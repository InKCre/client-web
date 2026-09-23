## 目标

让用户主要通过 client-web 连接、管理 Peer、安装与配置 Extension，并在浏览和操作信息时获得一致、清晰的反馈。

本 Draft PR 承载本轮全部分组，后续提交会继续在同一分支追加。

## 已完成：Peer 身份与生命周期

- 将 Settings 收敛为浏览器本地的连接、Peer ID、语言与完整导入/导出。
- 新增 Peers 页面，集中呈现当前浏览器和其他 Peer 的名称、应用版本、在线状态、能力与 Peer 配置。
- Web Peer 使用浏览器类型、主版本和系统生成默认名称；运行注册只刷新运行身份，保留用户名称和配置。
- 页面加载与 Refresh 通过 Peer lease 判断状态，不再额外调用 `/livez`。
- Extension、Memos 和 Twitter 的 Peer 选择器统一显示名称和应用版本，并清理运行节点语境中的 Client 命名。
- 同步 Core `peer-runtime-identity-v1` 数据库契约与本地技术文档。

## 已完成：Extension 发现与安装

- Extensions 页面提供 Registry Web 入口；搜索、详情与精确版本选择都在 Registry 完成，不再复制一套 Web listing。安装与 Peer 无关；每张已安装 Extension 卡片的「Enable… / Disable…」分别打开可多选 Peer 的弹窗。
- Registry 回跳 `/extensions?install=<name>&version=<exact>` 后，Web 重新读取 Release、展示 Host 信息并等待确认；打开链接不安装。未连接部署时显示 Settings 入口，已安装版本不会被静默替换。
- 安装确认只写部署级记录，不隐式启用、下载或执行 Extension。
- 启用/停用弹窗默认不选 Peer；取消不写入。逐 Peer 应用既有 Host/持久意图路径，成功保留，部分失败显示并读回实际状态。在线判断复用 Peers 页的服务端在线集合，不凭浏览器时钟推断。
- 已安装 Extension 显示精确版本和管理入口；改版直接使用部署级操作，并保留 enabled/setup state 的既有阻止不变量。
- Vite 开发服务器不再预打包 Extension runtime，确保它与应用共享同一份 `@inkcre/core` 状态。

## 已完成：配置表单

- Source 创建/编辑与 Peer 配置共用 JSON Schema 可视化表单；保留 JSON 模式和完整草稿，未知字段与无效 JSON 不会在切换时丢失。
- 不支持的 schema 仍可通过 JSON 编辑，内嵌表单不产生嵌套原生 `<form>`。凭据遮蔽只依据 schema 的 `format: password`，不改变读写语义。
- 配置 Form/JSON 复用 UI 包的受控 Tabs；Extension 发现不再属于 Web 内部视图。
- `InkAutoForm` 五处数组/可空字段动作已在 [UI #52](https://github.com/InKCre/ui/pull/52) 修正为 InkButton，并由正常 Version PR #53 发布 `@inkcre/ui-web@2.1.1`；Web、Mail、Memos、Twitter 与 ext-dev-utils 统一消费这一正式版本。

## 后续分组

- 全站表单布局审计发现的宿主错位、渐进式披露、下拉菜单与加载状态优化；本 PR 保持 Draft 承载这些组。

## 验证

- `pnpm check`
- `INKCRE_E2E_DATABASE_PROVIDER=external pnpm test:e2e:web`（7 passed，连接真实 core-py 开发运行时）
- 旧版内置 Discover 已在真实 `registry.inkcre.dev` + 隔离数据库验收；此记录不代表本轮跨站回跳已验收。本轮在本地与公开 preview 验证了未连接时的指引、精确 RSS Release 显示和禁用的安装动作；数据库 E2E 已补“回跳不写入、确认后安装”，并在 PR CI 通过。
- UI 2.1.0 正式包安装后，完整 `pnpm check` 再次通过，包括 Web 与三个 MF Extension 的类型、构建和包边界检查。第三组源码联调阶段已在浏览器检查嵌套/可空字段、未知字段保留、无效 JSON、单一原生 form 和 Tabs 历史；本轮远端 Workspace contract、Web/Webext E2E 与 Cloudflare preview 均通过。
- [PR preview](https://preview-client-web-pr-118.inkcre-client-web.pages.dev) 默认不预置连接；公开页面的空连接不作为联网数据面的通过证据。自动化使用隔离数据库，手工验收使用 owner 的兼容 self-hosted 部署。
- 在 owner 的 self-hosted Heroku 部署更新到 Core 0.6.2 后，实际从 PR preview 的 Settings 保存连接、刷新页面、打开 Peers，确认本浏览器 Peer 与 Core Peer 均为 Online，Core 显示 v0.6.2；对应[部署运行](https://github.com/xiaoland/core-py/actions/runs/35815978481)完成迁移、发布和公网探针。JWT 值未写入 PR 或日志；导入/导出验收产生的本地临时文件已删除。
- 同一联网环境此前完成导出→隔离浏览器导入→恢复同一 Peer 身份与在线列表；当前浏览器 Peer 人工改名在刷新后保留且已恢复原名。旧 Discover 的 Registry 搜索、版本分发标识、RSS 一键安装→Core 启用→Source 可视化创建/编辑/刷新→删除→扩展停用/卸载均通过；新回跳流程仍须重新验收。JSON 无效草稿和未知键的处理、Core/Web Peer 表单、密码遮蔽、Tabs 历史也已复核；Core Peer 配置无变更保存后刷新仍完整。未运行第三方采集；验收临时记录与含密钥导出文件已清理。
- 本轮在已连接 owner Heroku/Neon 部署的公开 preview 打开精确 RSS 0.2.1 回跳链接，确认后已安装、刷新仍保留；随后卸载了验收用记录。Registry #56 尚未部署，故“从 Registry Web 版本页实际点击回跳”的端到端步骤未验证。
- 仍待补一条不预填 localStorage 的 Settings 保存→刷新→Peers E2E。未连接浏览器现在显示连接指引，不再暴露底层 URL 错误。

关联：InKCre/ext-reg#56、InKCre/ext-reg#48、InKCre/core-py#118、InKCre/ui#50、InKCre/ui#51、InKCre/core-py#120、InKCre/core-py#121、InKCre/docs#31。

## 交付边界与回退

Core `peer-runtime-identity-v1`、UI 2.1.0 与 GitHub/Mail/Telegram Source wheel 0.3.2 已交付；本 PR
保持 Draft，后续继续承载交互质量分组。此分组无数据库迁移或新外部权限。若发布后表单回归，
可回退本 PR 的 Web 提交；既有 JSON 模式保留为不丢配置的操作路径。
