<!-- Create one packet for every non-trivial Consumer Task. `svc task init` creates only this shape. Do not create family children until their topology or information owner is admitted; keep this as a compact Human collaboration surface, not a completed-work log. -->

# client-web Peer 与 Extension 体验

- **目标**：让用户在 Web 中清楚地连接部署、管理 Peers、发现和安装 Extensions，并通过可视化表单完成配置。
- **边界**：逐组复核后实施；不预建通用 Wizard 框架。Settings 只管理元配置和本地配置，Peers 管理当前及其他 Peer。Extension 安装不依赖 Peer 选择。`docs#31` 保持开启，并随已交付界面更新。
- **终局验证**：每一组通过针对性行为检查、桌面浅色界面复核和仓库门禁；改变用户步骤时同步验证 docs preview。跨仓库 Peer 契约必须先由其权威仓库交付，再由消费者更新。
- **当前事实**：前两组已实施并验收；client-web#118 保持 Draft。第三组的 UI PR #50 与 Version PR #51 已合入，正式 `@inkcre/ui-web@2.1.0` 可安装；Core PR #120 与 Version PR #121 已合入，GitHub/Mail/Telegram wheel 0.3.2 均在 Registry 标为 published，Core 生产部署也已通过。client-web 的 Source 创建/编辑和 Peer config 共用可视化/JSON 草稿编辑器，Extensions Installed/Discover 使用路由型 Tabs；Web、三个 MF Extension 和 ext-dev-utils 统一锁定正式 UI 2.1.0。完整 `pnpm check` 已通过。源码联调时的浏览器验收覆盖嵌套/可空字段、JSON 切换保留未知键、无效 JSON 阻止切换与保存、Extensions 浏览器前进/后退；未提交任何验收用配置。docs#31 已更新四份 Source Web 教程并通过预览检查。公开 client-web preview 无预置连接配置。
- **验收反证（2026-09-23）**：Human 在公开 preview 从 Settings 填入部署 URL 与 JWT 后看到保存成功，但刷新后字段消失且 Peers 读取失败。当前不能把第三组/整体 PR 称为完成验收。现有 Web E2E 在页面启动前向 localStorage 预填连接，未覆盖空浏览器的 Settings 保存→刷新→Peers 读取。启动时配置加载失败会回退默认值，而 `initializeCore` 随后无条件写回，存在覆盖持久配置的路径；尚无证据证明本次就是该路径触发。现场浏览器当前 URL/JWT 字段为空，Peer ID 在一次刷新中保持不变；实际预览部署的 PR head 为 `e58e1be`。诊断和修复前不得将 CI 绿色等同于用户闭环通过。
- **部署兼容性证据（2026-09-23）**：用 Human 提供的 Heroku PostgREST URL 与 JWT 在隔离浏览器复现时，Settings 进入失败提示路径；浏览器日志为 `Web Peer register failed: Could not find the 'application_version' column of 'peers' in the schema cache`，因此本次并没有写入浏览器配置。该 self-hosted fork `xiaoland/core-py` 的最新 main 与 Heroku 部署运行均为 `2938494`（2026-09-21）；提供 `application_version` 的 Core PR #118 于 2026-09-22 合并，fork 尚未包含。Human 先前描述的“保存成功”与这次复现不一致，不能倒推当时的实际提示；仍需在兼容部署上验证真实保存→刷新闭环。隔离浏览器页已关闭，凭据未输出或写入文件。
- **兼容部署闭环（2026-09-23）**：获 Human 授权后，先在 `xiaoland/core-py` 禁用四条无关的 fork 自动发布工作流（runtime artifact、CLI、first-party Extension wheels、release PR），再把 fork main 非强制快进到上游 `3b7b1b1`。手动 Heroku+Neon 工作流 [35815978481](https://github.com/xiaoland/core-py/actions/runs/35815978481) 在该精确 SHA 上完成数据库收敛、双进程发布与公网探针。用户 Chrome 的 PR preview Settings 保存后刷新仍显示 PostgREST URL，Peers 实际读到本浏览器 Peer Online 与 Core Peer v0.6.2 Online；JWT 未出现在日志或任务包。故“同一兼容部署的首次连接→刷新→Peers”手工验收通过；原 E2E 绕过首次输入的覆盖缺口仍需修复。
- **联网验收（2026-09-23）**：同一 PR preview 连接更新后的 owner Heroku/Neon 部署。空浏览器导出的 v2 配置确实包含非空 JWT、PostgREST URL、Peer ID 和语言；导入隔离浏览器后恢复同一 Peer ID，并实际读取在线 Core v0.6.2。当前浏览器 Peer 人工改名后刷新仍保留，随后已恢复原名。Registry Discover 搜索、默认 stable 版本及 Core/Web 分发标识、无结果态和路由 Tabs 历史通过。`inkcre/rss@0.2.1` 一键安装无需 Peer、在 Core 启用后提供两种 Source type；临时 RSS Source #1 经可视化创建、编辑、刷新持久化、删除通过，未运行采集或创建日程。无效 JSON 阻止切换与提交，未知键在模式切换后保留但按 RSS schema 正确拒绝提交。Core Peer 的可空 URL、Web Peer 的嵌套 AI provider 数组和密码控件均实际渲染。RSS 已停用并卸载，隔离浏览器配置已重置，含密钥导出文件已删除。未验证真实第三方账号授权、采集结果或所有 Extension 的运行时组合，不把它们计入本 PR 通过范围。
- **复审后的需求变更（2026-09-23）**：Human 确认 `InkAutoForm` 五处数组/可空字段动作应复用 InkButton；Extension 发现与版本选择留在 Registry Web，Registry 仅携带插件名和精确版本回跳 Web，由用户确认安装。已删除 client-web 的 Discover listing 和 Tabs，改为“Browse Registry”入口及回跳确认页；未连接部署时仍可读取 Release，但不能安装。Registry 实现见 Draft PR [ext-reg#56](https://github.com/InKCre/ext-reg/pull/56)；UI 修正尚待独立 PR 和正式版本发布，当前 client-web preview 仍依赖 `@inkcre/ui-web@2.1.0`，不能将按钮修正计入其验收。
- **本轮验证（2026-09-23）**：`pnpm check` 通过；本地构建产物的空浏览器扩展页显示连接指引，不再暴露底层 URL 错误；`/extensions?install=inkcre%2Frss&version=0.2.1` 从公共 Registry 读到精确 RSS Release，展示坐标和 Host，未连接时安装按钮禁用。已给现有数据库 E2E 增加“打开回跳链接不写入 → 点击确认后写入”的检查；本机未配置一次性数据库的 SSH target，需由 PR CI 运行。完整跨站往返仍依赖 Registry preview 可用。
- **下一步**：更新 client-web#118 与 docs#31，观察远端检查；完成 Registry preview 的跨站回跳和 UI 正式版本消费前，不宣称两项修正已在公开 client-web preview 闭环。Web E2E 仍缺从空浏览器输入 Settings 再刷新读取的回归路径。

## 工作地图

完整依赖与返回见 [task-map.md](task-map.md)。

| Track                                                | 状态             | 当前返回                                                        | Human 注意         |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------------- | ------------------ |
| [Peer 身份与生命周期](track-peer-lifecycle.md)       | 环境兼容已闭环   | 升级 fork 后 Settings→刷新→Peers 在真实 Heroku 部署通过         | E2E 补空浏览器路径 |
| [Extension 发现与安装](track-extension-discovery.md) | 已实现待远端验收 | Registry Web 浏览并回跳精确 Release 确认安装                    | 跨站回跳验证       |
| [Schema 表单](track-schema-forms.md)                 | UI 修正待发布    | Source/Peer 共用可视化编辑器；InkButton 修正在 UI 独立 worktree | UI 包修复与发布    |
| [交互质量](track-interaction-quality.md)             | 已完成布局审计   | 两处宿主错位；联网安装态已补验                                  | 不先建抽象框架     |

## 已确认决定

见 [decisions.md](decisions.md)。
