# Track：Peer 身份与生命周期

## 目标

用户可以从独立的 Peers 页面识别和管理当前及其他 Peer；Settings 只管理当前浏览器的元配置、本地偏好和完整迁移。

## 已观察现状

- `/settings` 同时编辑元配置、当前 Peer config、语言、导入导出，并嵌入所有 Peer 列表。
- Registry URL 是 Peer config，却在 Settings 中编辑。
- Web 与 Core 注册都会在冲突时覆盖 Peer 名称；人工改名不能稳定保留。
- Web 默认名固定为 `Client Web`，没有浏览器、版本和系统信息。
- Peer 列表首次读取不建立在线集合；Refresh 只重新读列表；单独的 Check Health 丢弃 `/livez` 结果，最终仍以数据库 lease 判定在线。
- Peer 行没有应用版本字段；Cards 和 selectors 无法显示 Peer 版本。
- 当前导出保留 Peer UUID 和 URL，但排除 JWT，也不包含独立存储的语言偏好，不能在干净浏览器完整恢复。
- UI、i18n、组件说明和第一方 Extension 中仍有把运行节点称作 client 的内容。
- 已发现的 Peer selector 消费面包括 Extensions 主页面、Twitter setup wizard、Memos setup，以及 `Peer.listAsOptions()`；实施前仍需以全仓搜索复核清单。

## 已确认设计

### Settings

- 只管理 PostgREST URL、JWT Secret、当前 Peer ID 等元配置，以及语言等本地配置。
- 导出/导入恢复同一逻辑 Peer 和本地浏览器体验；保留 Peer UUID，并包括密钥、当前语言和后续调查确认的实际持久化本地偏好。
- 清理本地配置不删除数据库 Peer。
- 在未配置或连接损坏时仍可进入。

### Peers

- 独立路由和导航入口，包含当前 Peer 与其他 Peers。
- 展示名称、应用版本、Peer ID、当前 Peer 标记、lease 状态和能力概况。
- Registry URL 等 Peer config 从这里编辑；后续消费共用 Schema 表单。
- 初次进入及 Refresh 都重新读取列表和数据库时间判定的 lease 状态；移除独立 Check Health，不增加轮询。
- 读取失败与空列表、离线状态分别呈现。

### 名称

- Web Peer 首次创建时按浏览器、主要版本和系统生成 best-effort 默认名称。
- 默认名称不参与身份或去重。
- Web 重载与 Core 重启都不得覆盖人工名称；注册只刷新 runtime-owned facts。

### 版本

- Peer 的 `application_version` 表示运行该 Peer 的应用发布版本，而不是浏览器版本、Peer 协议版本或 Extension Host SDK 版本。
- Core 来源是应用包版本（当前 `pyproject.toml` 为 `0.6.0`）；Web 来源是 `apps/client-web/package.json`（当前 `0.1.2`）。
- Host SDK 版本继续只服务 Extension 兼容判断；Core 与 Web 当前均为 `0.3.0`，不冒充 Peer 应用版本。
- Peer 行增加可空 `application_version`，由运行时注册时发布并在应用升级后更新；历史行显示“版本未知”，下次注册自然补齐。
- Cards、selector 候选项和已选值统一显示名称与应用版本。版本缺失不影响选择，离线 Peer 显示最后一次上报版本。
- 如果未来要在 selector 中预判 Extension 兼容性，再单独设计包含 SDK 身份与版本的契约；本轮不提前加入。

### 术语

- 运行节点统一称为 Peer，并同步 Hub、Spoke 本地文档、UI、i18n、错误信息和第一方 Extension 中相同语义的用法。
- 保留 package/API/OAuth/第三方客户端中的正确 client 用法。

## 跨仓库链路

1. Hub 定义 Peer 应用版本语义、运行时写入责任和产品术语。
2. core-py 交付数据库 migration、模型、注册行为和应用版本来源。
3. client-web 同步数据库契约，更新 Peer model、Web 注册、路由、Settings/Peers 与 selectors。
4. docs#31 按已交付界面更新用户操作，继续保持 Draft。

## 验收意图

- 未配置浏览器能打开 Settings 并建立连接。
- 干净浏览器导入后恢复元配置、密钥、Peer 身份和本地偏好；Peer config、Extension 状态从原数据库权威读取。
- Settings 不再出现 Registry URL 或 Peer 列表。
- Peers 页面能区分当前/其他 Peer，并在 Cards 与所有 selectors 显示统一的名称和应用版本。
- 人工改名在 Web 重载和 Core 重启后保留。
- 新 Web Peer 得到可识别默认名称。
- 有效 lease 首次打开即为在线，过期后 Refresh 为离线，读取失败不伪装为空列表。
- 产品域 `client` 用法清零，明确例外不受影响。

## 实施返回

- Hub 契约已由 docs#31 分支提交 `d87049c`。
- core-py 已交付 migration、生产者、发布片段与数据库验收，Draft PR 为 `InKCre/core-py#118`；隔离 runtime 已收敛到 `c7249e4`、migration `a0465e3b028f` 和 `peer-runtime-identity-v1`。补齐发布片段后的远端 repository、runtime、CLI 和 preview 检查全部通过。
- client-web 已完成 Settings/Peers 拆分、完整导入导出、Web 默认名、应用版本、lease 刷新状态和 selectors 展示。
- client-web 提交为 `18ae924`，覆盖全部 Track 的 Draft PR 为 `InKCre/client-web#118`；built artifact 对隔离 core-py runtime 的 Playwright 验收为 7/7，workspace、webext E2E 与 Pages preview 通过。
- client-web 的 stable-Core E2E 按预期失败：当前 stable 尚无 `application_version` schema。依既有 producer-first 规则，先发布 core-py#118，再刷新该检查；不加入临时兼容分支。
- docs#31 提交 `9288710` 同步新步骤与 Settings/Peers 桌面浅色截图；Website contract 与 `https://preview-docs-pr-31.inkcre-website.pages.dev` 均通过。
- 原始桌面浅色复核图和可重跑脚本保存在 `assets/` 与本任务包内，不进入产品提交。

## 当前下一步

等待 Human 复核第一组。合并时先让 core-py#118 进入 stable，再刷新 client-web#118 的数据库 E2E；本轮不自行合并。
