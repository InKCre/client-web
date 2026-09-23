# Track：Extension 发现与安装

## 目标

用户能够浏览和搜索 Registry 中的 Extensions，并从 Registry 一键安装；安装不要求先选择 Peer，启用或配置时才按能力需要选择目标 Peer。

## 已确认边界

- 发现、版本选择和安装属于部署级 Extension 流程。
- Peer 选择不能继续充当安装的前置条件。
- 所有 Peer selector 消费 Peer Track 交付的“名称 + 应用版本”展示约定。
- 不建设通用 Wizard 框架。

## 现状证据

- Extension 安装记录是 deployment-scoped，`enabled[]` 才表达各 Peer 上的启用意图。
- client-web 现在通过所选 Peer 执行 install/change-version；Web runtime 的 Release reader 同时校验 Module Federation association 与 SDK 兼容性。
- core-py 的 install 同样绑定 Python association；实际启用/启动时又会重复执行通道校验与获取。
- Registry 已有 published Extension 列表、单 Extension 全部 published Releases 和 exact Release 接口；列表不包含推荐版本，详情的返回顺序也不等于 SemVer 顺序。
- Registry toolkit 的静态 preview 目前只生成 exact Release，尚缺列表和 Extension 详情投影。
- 版本变更会被两类已有不变量阻止：仍有 Peer enabled，或共享 setup state 非空。
- core-py 的 Python 已加载版本保护现在只在 install 入口；安装脱离 Host 后必须把该保护移至 acquisition/import 之前。

## 拟定责任边界

### Registry 与安装

- install/change-version 只校验精确 Release 坐标、published 状态和响应一致性，然后写入部署级记录。
- 不在安装时要求 Python 或 Module Federation distribution，也不下载、导入或执行 Extension。
- 正式 Registry API 暂不增加搜索或 latest 端点；当前规模下对 summary 列表的 name/nickname 做本地搜索即可。
- 用户打开某 Extension 时再读取详情；使用已有 semver 能力默认选中最高 stable 版本，然后一次点击安装。仅有 prerelease 时明确标记，不隐式自动升级。
- 静态 Registry preview 补齐列表和 Extension 详情投影，保持与正式 API 同契约。

### Host 执行

- Web Host 在 enable/start 时校验 Module Federation association、SDK 范围和 manifest URL。
- Core Host 在 acquire/start 时校验 Python association，并在下载或导入前检查当前进程已加载版本；版本不同时明确要求重启。
- 启用失败不写入该 Peer 的 enabled 意图；不增加 running 持久化状态。
- Extension config 仍是 deployment-scoped；Peer 只是必须运行 Extension 代码时的执行入口。

## 拟定 Web 交互

- Extensions 页保持一个产品入口，内部分成“已安装”和“发现”两个清晰视图；不建设通用 Tabs 或 Wizard 框架。
- “已安装”是默认视图。Peer selector 只出现在“在 Peer 上运行”语境，控制启用/禁用及需要 Host 的 setup/config 执行；版本变更和卸载不依赖该选择。
- “发现”只包含搜索、Registry 列表、按需读取的详情/版本选择和安装动作；Core 离线或 Peer 列表失败不影响浏览和安装。
- 安装成功后显示“已安装，尚未在 Peer 上启用”与“管理”入口。已安装的 Extension 不把“安装”暗中变成“改版”。
- 精确 Release 的帮助图标/链接可跳转 Registry 文档，不在 client-web 内嵌文档。
- 加载、Registry 不可用、空 Registry 和搜索无结果使用各自明确的现有 UI 状态，不用一块通用占位表达全部情况。

## 拟定最小实现

- ext-reg client-web runtime：在现有 Reader 上分开通用 exact Release 读取与 Web 可执行投影，并复用已生成 SDK 增加 list/detail 读取；不增加 interface/factory/channel registry。
- ext-reg toolkit：让静态 preview 输出已存在正式 API 的 list/detail 形状。
- client-web：删除手工 name/version 安装表单及 Peer-scoped install 调度，复用现有 UI 组件完成发现视图，保留 Peer-scoped enable 调度。
- core-py：让 resolve/install 保持通用 Release 语义，将 Python association 与已加载版本校验放到 acquire/start 边界。

## 拟定验收

- Core 离线且无可用目标 Peer 时，Python-only Release 仍能安装，且 `enabled=[]`，不下载、导入或执行 Extension。
- 缺少 MF 或 Web SDK 不兼容的 Release 能安装；在 Web Peer 启用时被拒绝，并保持 enabled 不变。
- SemVer 顺序与发布时间相反、同时含 prerelease 的数据下，默认选中最高 stable，其他 published 精确版本可显式选择。
- 任一 Peer 仍 enabled 或 setup state 非空时，改版显示真实阻止原因，不自动禁用 Peer 或清空 state。
- Python v1 启用后禁用，通过 Web 改为 v2，再在同一 Core 进程启用时，必须明确要求重启，不运行旧类也不覆盖已加载 wheel。
- 真实 Registry preview 可浏览、搜索、选择版本并安装；Registry 读取失败不影响已安装列表。
- 白色桌面视口验收对齐、下拉布局、加载和空/无结果状态。

## 实施返回

- ext-reg runtime 已将 list、detail、exact Release 与 Web 可执行投影分开；静态 preview 同步生成三类既有 API 投影。Git 候选发布使用构建后的 JavaScript 和源码类型入口，兼容 Node 22 且不维护手写声明。PR `InKCre/ext-reg#48` 已合并；后续发布账本修复 Draft PR #49 的远端检查已通过，等待合并授权。
- core-py 已把 Python association 与已加载版本校验移到 acquisition 之前；install 只验证 published exact Release 并写入部署级记录。`InKCre/core-py#118` 已合并，main runtime artifact 发布成功；正式 Core `0.6.1` 由 release PR #116 等待合并。
- client-web 已删除手工坐标安装表单和 Peer-scoped install 调度，新增 Installed / Discover 两视图、本地搜索、按需详情、SemVer 版本选择与一键安装；Peer selector 仅保留在运行语境。
- Git 候选在 Vite 开发服务器中曾被依赖预打包成第二份 `@inkcre/core` 状态实例；现仅排除该 runtime 的开发期预打包。真实 Registry 浏览与 GitHub `0.3.1` 安装随后通过，生产构建也只保留一份共享依赖。
- client-web 已锁定最新 ext-reg 候选，提交 `debc81b` 已推送到 Draft PR `InKCre/client-web#118`；`pnpm check`、Workspace contract、client-webext E2E 与 Cloudflare Pages preview 通过。白色 `1440×810` 桌面复核覆盖发现、搜索、版本 Host 说明、安装成功与已安装管理态。
- stable-Core E2E 仍按 producer-first 预期失败：stable 数据库契约尚无 `peers.application_version`，导致 Web Peer 注册失败及后续页面级联失败；core-py#118 发布后再刷新，不加入旧 schema fallback。

## 当前下一步

等待 Human 授权合并 ext-reg #49、其后生成的 Web Runtime Version PR，以及 core-py release PR #116；正式版本发布后刷新 client-web #118 的 stable-Core E2E。不在这一 Track 建设搜索服务、自动更新、通用 Wizard 或通用 Tabs。

## 2026-09-23 需求修订

上述 Web 内置 Discover 的方案与验收属于旧需求的历史记录，不再代表当前目标。Human 确认 Registry Web 自己承担搜索、详情和版本选择；client-web 仅提供 Registry 入口，并在 `/extensions?install=<name>&version=<exact>` 上重新读取精确 Release、展示部署级安装范围，等待用户确认。打开链接不得写数据库，已安装版本不得被静默替换。Registry 只保留来源 Web origin 用于生成链接，不接触 JWT 或部署连接。实现及验证状态以本 packet 首页的最新记录为准。
