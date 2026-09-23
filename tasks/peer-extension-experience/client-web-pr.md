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
- 原生链接继承宿主文字色，不再让 Browse Registry、Settings 等链接回退为浏览器默认蓝色或已访问紫色；保留各组件自身更具体的样式。

## 第四组：交互质量

- Settings 只显示当前任务需要的连接、语言、备份操作；删除导出内容的常驻说明。Peer 身份/能力、Extension 版本管理/文档、搜索帮助与技术错误按需展开。
- 页面不重复 Header 标题；浏览器标题跟随路由、已保存的 Source 名称和当前 Web Peer 名称，不使用未提交草稿。
- 首次读取使用结构化骨架；刷新保留原内容，失败提供重试。独立内容等待仍使用三点式，紧凑行内状态使用 spinner，轮询间隔不持续转圈。
- Dialog 将交互锁定与动作 loading 分开：保存时仅保存按钮转圈，取消可禁用但不转圈。UI #54 同时交付 Dropdown 搜索提示和相对 spacing token，后续通过正常 Version PR 发布。
- Recall 普通检索只由目标页面发起；Find path 的过期响应不污染新模式。Job 区分不存在与读取失败，日志刷新失败保留已有内容。

UI #54 与正常 Version PR #55 已合并，`@inkcre/ui-web@2.2.0` 正式发布且由全部五个消费者精确锁定。正式包的完整 `pnpm check` 与本机浏览器扩展 E2E 通过；最新数据库 CI 和公开 preview 证据在交付完成后更新。本 PR 与 docs#31 均不合并。

## 验证

- `pnpm check`
- 既有 PR CI 的 Web/Webext E2E、Workspace contract 与 Cloudflare preview 均通过。Web E2E 使用独立、可销毁的数据库，覆盖“回跳不写入、确认后安装”、取消 Peer 弹窗不写入，以及两个离线 Peer 的批量启停。旧 head 的绿色检查不代表第四组最新提交已通过。
- 正式 InkUI 2.1.1 接入后，完整 `pnpm check` 再次通过，包括 Web 与三个 MF Extension 的类型、构建和包边界检查。第三组源码联调已在浏览器检查嵌套/可空字段、未知字段保留、无效 JSON、单一原生 form 和 Tabs 历史。
- [PR preview](https://preview-client-web-pr-118.inkcre-client-web.pages.dev) 默认不预置连接；公开页面的空连接不作为联网数据面的通过证据。自动化使用隔离数据库，手工验收使用 owner 的兼容 self-hosted 部署。
- 在 owner 的 self-hosted Heroku 部署更新到 Core 0.6.2 后，实际从 PR preview 的 Settings 保存连接、刷新页面、打开 Peers，确认本浏览器 Peer 与 Core Peer 均为 Online，Core 显示 v0.6.2；对应[部署运行](https://github.com/xiaoland/core-py/actions/runs/35815978481)完成迁移、发布和公网探针。JWT 值未写入 PR 或日志；导入/导出验收产生的本地临时文件已删除。
- 同一联网环境完成导出→隔离浏览器导入→恢复同一 Peer 身份与在线列表；当前浏览器 Peer 改名刷新后保留且已恢复原名。JSON 草稿、密码遮蔽和 Tabs 历史亦已复核。未运行第三方采集；含密钥导出文件已删除。
- 在连接 owner Heroku/Neon 部署的公开 preview 中，精确 RSS 0.2.1 回跳链接打开后须确认才安装，刷新仍保留。Heroku Eco 休眠时 Core 在 Peers 页和弹窗均显示离线；唤醒后均显示在线，从弹窗启用、停用 Core 成功。验收用 RSS 随后卸载，最终预览显示未安装扩展。[Registry #56 Web 预览](https://inkcre-ext-reg-pr-56-bcb9e238282c.herokuapp.com/)已在精确 PR head 上运行；其目录为空，故“从版本页实际点击回跳”的跨站一步尚未验证。
- 已补空浏览器 Settings 保存→刷新→Peers、Source 已保存名称/草稿/历史/刷新、首页 Peer 名称、Dialog 取消不转圈、读取失败与恢复回归。首批源码联调 11/11 通过；扩展轮 8/12，4 项遭遇开发服务器模块 502；新增标题与 Peer 保留详情均通过。后续本地整轮准备被 Docker API 无响应阻断，不能将分轮结果声称为完整 12 条通过。正式包接入后由既有 CI 隔离环境重跑。

关联：InKCre/ext-reg#56、InKCre/ext-reg#48、InKCre/core-py#118、InKCre/ui#50、InKCre/ui#51、InKCre/core-py#120、InKCre/core-py#121、InKCre/docs#31。

## 交付边界与回退

Core `peer-runtime-identity-v1`、UI 2.1.1 与 GitHub/Mail/Telegram Source wheel 0.3.2 已交付；本 PR
保持 Draft，后续继续承载交互质量分组。此分组无数据库迁移或新外部权限。若发布后表单回归，
可回退本 PR 的 Web 提交；既有 JSON 模式保留为不丢配置的操作路径。
