<!-- Create one packet for every non-trivial Consumer Task. `svc task init` creates only this shape. Do not create family children until their topology or information owner is admitted; keep this as a compact Human collaboration surface, not a completed-work log. -->

# client-web Peer 与 Extension 体验

- **目标**：让用户在 Web 中清楚地连接部署、管理 Peers、发现和安装 Extensions，并通过可视化表单完成配置。
- **边界**：逐组复核后实施；不预建通用 Wizard 框架。Settings 只管理元配置和本地配置，Peers 管理当前及其他 Peer。Extension 安装不依赖 Peer 选择。`docs#31` 保持开启，并随已交付界面更新。
- **终局验证**：每一组通过针对性行为检查、桌面浅色界面复核和仓库门禁；改变用户步骤时同步验证 docs preview。跨仓库 Peer 契约必须先由其权威仓库交付，再由消费者更新。
- **当前事实**：client-web#118 与 docs#31 保持 Draft。四组实现已交付；UI #54/#55 合并后正式发布 2.2.0，五个 Web 消费者已精确锁定。产品提交 `1dd5d02` 的完整 CI 通过，数据库 E2E 12/12，已补空浏览器 Settings 保存→刷新→Peers 和首屏文案回归。公开 preview 已连接 owner 部署复核，docs 步骤和桌面配图同步；完整证据及未实测范围见 [交互质量 Track](track-interaction-quality.md)。Core PR #120/#121 与 GitHub/Mail/Telegram wheel 0.3.2 已交付。Registry #56 的跨站点击仍按其 Track 独立追踪。

## 前序调查与需求演变

以下按发生顺序保留，不代表当前未完成项；当前状态以以上事实和工作地图为准。

- **验收反证（2026-09-23）**：Human 在公开 preview 从 Settings 填入部署 URL 与 JWT 后看到保存成功，但刷新后字段消失且 Peers 读取失败。当前不能把第三组/整体 PR 称为完成验收。现有 Web E2E 在页面启动前向 localStorage 预填连接，未覆盖空浏览器的 Settings 保存→刷新→Peers 读取。启动时配置加载失败会回退默认值，而 `initializeCore` 随后无条件写回，存在覆盖持久配置的路径；尚无证据证明本次就是该路径触发。现场浏览器当前 URL/JWT 字段为空，Peer ID 在一次刷新中保持不变；实际预览部署的 PR head 为 `e58e1be`。诊断和修复前不得将 CI 绿色等同于用户闭环通过。
- **部署兼容性证据（2026-09-23）**：用 Human 提供的 Heroku PostgREST URL 与 JWT 在隔离浏览器复现时，Settings 进入失败提示路径；浏览器日志为 `Web Peer register failed: Could not find the 'application_version' column of 'peers' in the schema cache`，因此本次并没有写入浏览器配置。该 self-hosted fork `xiaoland/core-py` 的最新 main 与 Heroku 部署运行均为 `2938494`（2026-09-21）；提供 `application_version` 的 Core PR #118 于 2026-09-22 合并，fork 尚未包含。Human 先前描述的“保存成功”与这次复现不一致，不能倒推当时的实际提示；仍需在兼容部署上验证真实保存→刷新闭环。隔离浏览器页已关闭，凭据未输出或写入文件。
- **兼容部署闭环（2026-09-23）**：获 Human 授权后，先在 `xiaoland/core-py` 禁用四条无关的 fork 自动发布工作流（runtime artifact、CLI、first-party Extension wheels、release PR），再把 fork main 非强制快进到上游 `3b7b1b1`。手动 Heroku+Neon 工作流 [35815978481](https://github.com/xiaoland/core-py/actions/runs/35815978481) 在该精确 SHA 上完成数据库收敛、双进程发布与公网探针。用户 Chrome 的 PR preview Settings 保存后刷新仍显示 PostgREST URL，Peers 实际读到本浏览器 Peer Online 与 Core Peer v0.6.2 Online；JWT 未出现在日志或任务包。故“同一兼容部署的首次连接→刷新→Peers”手工验收通过；原 E2E 绕过首次输入的覆盖缺口仍需修复。
- **联网验收（2026-09-23）**：同一 PR preview 连接更新后的 owner Heroku/Neon 部署。空浏览器导出的 v2 配置确实包含非空 JWT、PostgREST URL、Peer ID 和语言；导入隔离浏览器后恢复同一 Peer ID，并实际读取在线 Core v0.6.2。当前浏览器 Peer 人工改名后刷新仍保留，随后已恢复原名。Registry Discover 搜索、默认 stable 版本及 Core/Web 分发标识、无结果态和路由 Tabs 历史通过。`inkcre/rss@0.2.1` 一键安装无需 Peer、在 Core 启用后提供两种 Source type；临时 RSS Source #1 经可视化创建、编辑、刷新持久化、删除通过，未运行采集或创建日程。无效 JSON 阻止切换与提交，未知键在模式切换后保留但按 RSS schema 正确拒绝提交。Core Peer 的可空 URL、Web Peer 的嵌套 AI provider 数组和密码控件均实际渲染。RSS 已停用并卸载，隔离浏览器配置已重置，含密钥导出文件已删除。未验证真实第三方账号授权、采集结果或所有 Extension 的运行时组合，不把它们计入本 PR 通过范围。
- **复审后的需求变更（2026-09-23）**：Human 确认 `InkAutoForm` 五处数组/可空字段动作应复用 InkButton；Extension 发现与版本选择留在 Registry Web，Registry 仅携带插件名和精确版本回跳 Web，由用户确认安装。已删除 client-web 的 Discover listing 和 Tabs，改为“Browse Registry”入口及回跳确认页；未连接部署时仍可读取 Release，但不能安装。Registry 实现见 Draft PR [ext-reg#56](https://github.com/InKCre/ext-reg/pull/56)；UI 修正随后由 #52/#53 正式发布并已消费。
- **本轮验证（2026-09-23）**：`pnpm check`、PR #118 的 Workspace contract、Web/Webext E2E 与 Cloudflare preview 全部通过。本地和公开 preview 的空浏览器扩展页显示连接指引，不再暴露底层 URL 错误；`/extensions?install=inkcre%2Frss&version=0.2.1` 从公共 Registry 读到精确 RSS Release，展示坐标和 Host，未连接时安装按钮禁用。数据库 E2E 已覆盖“打开回跳链接不写入 → 点击确认后写入”。在 Human 已连接的公开 PR preview + Heroku/Neon 部署中，确认按钮将 RSS 0.2.1 写入已安装列表，刷新仍保留；随后已卸载，恢复未安装。Registry #56 尚未部署，故从其 Web 版本页点击进入的完整跨站往返仍待验收。
- **后续边界**：client-web#118 与 docs#31 已同步新步骤；UI 正式版已消费。Registry #56 的独立 Web 预览已部署，但其空数据库没有可点击的正式 Release，暂不声称跨站实际点击已验收。Web E2E 仍缺从空浏览器输入 Settings 再刷新读取的回归路径，既有手工验收通过不替代自动化覆盖。
- **新增独立修正（2026-09-23）**：Human 要求 Extension 启用、停用时另弹出可多选 Peer 的对话框。现有页面级 Peer 下拉加单卡开关只能表达一个 Peer，拟删除该选择器，改为每张卡的启用/停用动作打开同一个对话框；分别列出尚未启用/已启用的 Peer，默认不选。每个目标继续经过现有当前 Host、远端 Host 或持久意图路径；逐 Peer 执行，成功保留，部分失败显示并读回权威状态，不做批量事务或自动重试。验证重点为取消无写入、两个离线 Peer 的批量启停、当前浏览器 setup 收尾和窄屏/键盘可达性。UI PR #52 已按授权建立，正式版本消费另行追踪。
- **弹窗验收中发现的在线判定偏差**：在 Human 已连接的公开 preview 中，Peers 页通过服务端 `PeerManager.listLive()` 把 Core v0.6.2 标为在线，Extension 弹窗却用浏览器 `Date.now()` 比较 lease，标为“下次协调时生效”。已改为与 Peers 页一致的服务端在线集合；不增加数据库 running 状态。需在新 preview 复核 Core 的管理路径及取消、提交状态。Web E2E 首轮在创建测试 Peer 时因缺少数据库必填字段止步，现已补齐并等待重跑。
- **UI 正式发布与消费**：InkAutoForm 动作修正在 UI PR #52 合并后，经正常 Version PR #53 发布为 `@inkcre/ui-web@2.1.1`；包仓库已可读取该版本。Web、ext-dev-utils、Mail、Memos、Twitter 正在统一升级，需以最终 PR 检查及联网 preview 为准。
- **本轮验收结论（2026-09-23）**：五个 Web 消费者已统一升级到正式 UI 2.1.1，完整 `pnpm check` 与 PR #118 最新 head 的全部检查、Cloudflare preview 均通过。Web E2E 在真实隔离数据库上验证确认安装、取消无写入、两个离线 Peer 批量启停。公开 preview 连接 owner Heroku/Neon 部署，Core Eco dyno 休眠时 Peers 页和弹窗均显示离线；唤醒后均显示在线，在线 Core 启用、停用 RSS 成功。最后卸载 RSS，刷新后的最终 preview 显示未安装扩展。Registry #56 的独立 Web 预览在精确 PR head 上运行，但空目录尚不能完成版本页的跨站点击验收；本 PR 继续保持 Draft。另一个既有缺口是空浏览器 Settings 保存→刷新→Peers 的自动化回归，手工链路此前已通过。
- **链接颜色复核（2026-09-23）**：公开 preview 的原生 Browse Registry 链接使用浏览器默认蓝色，已访问的 Settings 链接变为默认紫色；应用未设置原生 `<a>` 的颜色。用宿主一条继承规则保留 InkUI 文字色、下划线及组件自有样式，不增加链接组件。
- **Registry 预览发现（2026-09-23）**：`registry-preview.yml` 的工作流运行 35825019767 在 PR #56 head `d58bdcb` 上成功交付完整 CPython Web，`/livez` 返回相同修订号，首页 200，`/v1/extensions` 为空。预览 URL 记录于 GitHub Deployment 6607501622，但 `workflow_run` 的 Deployment ref 是 `main`，因此 PR #56 的 checks 不呈现预览地址；这是关联与可发现性缺口，不是预览环境缺失。
- **Peer 删除新增需求（2026-09-23）**：Human 要求 Peers 页可删除 Peer，第二条待补。Web 当前可直接读写 `peers`，但没有删除入口；本浏览器删除后会再次注册，在线 Peer 的运行时亦可能重注册。`extensions.enabled[]` 以 UUID 存引用，若先删 Peer，将无法再通过现有 RPC 停用该 UUID，进而阻碍扩展卸载/换版。拟只允许删除离线的非当前 Peer，在确认后先逐个停用其扩展，再删除 Peer 行；失败时保留卡片并显示错误，已成功的停用不回滚，重试可继续。验收覆盖取消、在线/当前不可删、带扩展绑定的离线 Peer 删除后无残留 UUID。具体边界仍待复核。
- **Peer 删除实现与验证（2026-09-23）**：按单用户 deployment 的 best-effort 模型，不引入新数据库 RPC 或通用删除框架。当前浏览器不显示删除；在线 Peer 禁用删除；确认时再次按服务端 lease 核对，先用现有 Extension RPC 清掉该 Peer 的每条 `enabled[]` 关系，再删除 Peer 行。失败保留卡片与错误，重试继续未完成的清理。`pnpm check` 全通过；使用临时 GHCR 凭据和本机隔离 Compose 的 `pnpm test:e2e:web` 8/8，通过取消、在线限制、当前身份限制及启用关系清理，测试资源与临时凭据已销毁。已咨询 advisor：其建议为并发启用/删除增加数据库事务和锁；鉴于既定单用户 best-effort 边界，本轮不承担这一跨仓库协议成本。

## 工作地图

完整依赖与返回见 [task-map.md](task-map.md)。

| Track                                                | 状态                     | 当前返回                                                                          | Human 注意                                       |
| ---------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Peer 身份与生命周期](track-peer-lifecycle.md)       | 环境兼容与回归已闭环     | Settings→刷新→Peers 在真实 Heroku 部署与隔离数据库 E2E 均通过                     | 随整体 PR 复核                                   |
| [Extension 发现与安装](track-extension-discovery.md) | 已实现待远端验收         | Registry Web 浏览并回跳精确 Release 确认安装                                      | 跨站回跳验证                                     |
| [Schema 表单](track-schema-forms.md)                 | 正式包已接入             | Source/Peer 共用可视化编辑器；当前统一消费 UI 2.2.0                               | 随整体 PR 复核                                   |
| [交互质量](track-interaction-quality.md)             | 正式发布、实现与验收完成 | UI 2.2.0；Web 正式包 CI 数据库 12/12 与公开 preview 复核；docs 步骤和桌面图已同步 | #118 与 docs#31 保持 Draft；人工矩阵边界见 Track |

## 已确认决定

见 [decisions.md](decisions.md)。
