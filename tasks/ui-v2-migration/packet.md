# UI 2.0 真实下游迁移

2026-09-13，用户授权发布 UI，并在独立分支与 worktree 中迁移 client-web 及各 extensions。本工作包拥有消费者实施与验证；UI 生产者的 `tasks/ui-foundations/packet.md` 继续拥有总图和发布依赖。

## 目标与边界

从锁定 UI 1.4.0 的旧 Token／交互调用，迁移到 registry 正式发布的 2.0.0，并使 Web、mail、twitter 及扩展开发工具可以安装、构建和实际使用。分支为 `feat/ui-v2-migration`，基于最新 `origin/main` 的 `54882ac`，worktree 为 `.worktrees/client-web-ui-v2-migration`；原始 checkout 不修改。

拥有相关 manifests／lockfile、源码联调映射、Web 与扩展 UI 调用及样式、同版本指南读取入口、适用 Changeset 和受影响的验证。保留业务权限、Peer 数据责任、Core 公共契约和数据库投影、扩展身份与 Module Federation 交付边界。消费者生产部署及扩展发布不随本次 UI 包发布自动执行；不修改共享 Hub，不继续 Firefox 原生文字放大专项。

## 当前事实与实施次序

1. UI 功能 PR #43 和版本 PR #44 已合入。正式 Release run 34739131474 成功，四个消费者均从 GitHub Packages 安装精确 2.0.0，lockfile 记录正式 tarball 与 integrity。
2. 最新 main 比初审基线增加了 setup wizard 等真实调用。除 Web、mail、twitter，`packages/ext-dev-utils` 也声明 UI 1.4.0。需要逐处重新核对，不能只应用旧局部补丁。
3. 先完成依赖责任、Vue 下限和源码映射，再按用途迁移文本／配色、Sass helper、原生提交、pending、JSON 草稿及浮层可访问名称。相同问题覆盖全部实际消费者，不只修首个例子。
4. Agent 从本仓库入口读取已安装 UI 同版本 DESIGN.md 和 Skill；具体默认与 API 由包提供，不在消费者复制设计规范。
5. 在 registry 依赖下完成 pnpm check（含 build）、既有 E2E 和关键页面验收；另行检查源码联调。临时消费页、类型映射和源码联调不替代真实产物证据。

## 变更判断

当前修改将旧调用转换为新的公开契约，影响 Web 页面、扩展 UI 和开发联调。保持既有业务流程与保存成功／失败语义；JSON 编辑在文本草稿、验证、确认与持久化边界之间显式流转，不在逐字输入时修改持久化对象。Token 迁移按内容用途决定，不把所有 label-sm 简单映射成同一个角色。静态检查验证名称、类型和产物，真实页面验证草稿保留、重复提交、关闭和错误反馈。

## 验证进展

registry 安装、全 workspace 的 pnpm check（含 Core、Web、mail、twitter、WXT 构建）、源码联调类型检查、实际 Chromium 扩展 popup E2E 及从 apps/client-web 执行 Intent load 已通过。UI 内部依赖不再由 Web 重复声明，源码联调只共享 Vue／UnoCSS。

发现 Peer.save 与 saveConfig 原先忽略 PostgREST error；在原模型方法上使用 throwOnError，避免配置界面误报成功。这是保存迁移的必要边界修复，包含 Core patch Changeset。新增既有 peer-database E2E 旅程验证语法／schema 无效草稿、pending 禁止重复操作与 Escape、真实数据库拒绝后保留草稿、重试持久化。

本机的 SSH Docker provider 连续两次握手被重置，本机无 Docker；pnpm test:e2e:web 在启动隔离实例前失败，尚未执行浏览器断言。此项交由 PR 的既有 client-web E2E job 运行，不改用共享开发数据库。lint:type-aware 报告 11 条已有问题（数据库生成文件 9 条、extension/model.ts 与分发检查脚本各 1 条）；这些告警所在逻辑沿用基线；分发脚本后来增加了 UI 共享检查，原有 sort 告警未改变。普通 lint 和正式 check 通过，不手改生成投影。

迁移已提交至独立 [PR #104](https://github.com/InKCre/client-web/pull/104)。首个源码提交 `5873510` 的 [Client checks](https://github.com/InKCre/client-web/actions/runs/34739437023) 全部通过，包括新增的真实数据库保存旅程；本机 SSH 失败不再构成缺少该项证据。

后续实际 MF 加载发现 Host 与扩展各自打包 UI，导致中文 Host 的 Twitter 时间选择器仍使用英文。已将 UI 加入现有共享单例配置，并让分发检查确认使用 UI 的扩展确实声明对应共享版本。复核确认中文注入、时间草稿取消／确认、Mail renderer 和下载 pending／失败恢复均正确；窄屏附件行和 Info-Base 浮层同步修复。证据与复跑方式见 [验收记录](evidence/README.md)。

本地最终检查已覆盖这些修正。PR 当前提交的远端结果以 checks 页面为准；消费者保持独立分支供审阅，尚未合入 main、生产部署或发布扩展。

## 2026-09-13 视觉迁移复审

用户指出上一轮截图仍有圆角卡片，认为消费者迁移不完整。撤回“迁移全部完成”的表述：现有检查证明依赖、API 和已列出的交互可用，不能证明所有页面遵循设计指南。PR #104 继续作为本次迁移载体。

已确认 Mail 附件行、搜索结果／输入、Twitter 媒体网格和开发页仍保留旧圆角；多处正文、标题、代码及步骤文字也在局部覆盖字号、行高、字重。目标从“旧调用适配新包”调整为“逐页兑现已发布的设计角色、分组、状态和内容适应规则”，保留业务行为、数据和平台责任，按实际页面验证。

当前 DESIGN.md 没有明文禁止圆角，Token 的圆角族仍含 4／8／16／32px、none 和 full。因此不能伪称已有全局禁用规则。普通业务容器的圆角按用户本次指出的问题处理；是否将直角默认及功能形状例外明确写入生产者指南，已向用户澄清，期间继续消费者已确认部分。

复审覆盖 Web 页面与共享局部视图、mail／twitter 的 renderer 与 setup、ext-dev-utils。检查重点包括容器边界、文字职责与覆盖、配色和反馈、原生控件组合、默认布局与窄容器。外部内容 iframe 和有功能意义的媒体图形分别审查，不通过全局 CSS reset 掩盖局部问题。

复审实施结果：Web 搜索、Peer 状态、来源配置和日志容器，以及 Mail 附件、Twitter 媒体和开发页不再保留旧圆角。正文、标题、元数据和代码使用完整字体角色；Twitter setup 保留圆形步骤编号，作为尚待确认的功能形状。Source／Extensions／Job 页面按可用宽度换行，原有内容和操作不再依赖 420px 固定表单或 40%／60% 列宽。来源导航改用链接，日志展开改用原生按钮，均可通过键盘操作。

真实页面还发现 Text、HTML 文本和 Tweet 的完整阅读 renderer 沿用摘要截断，Tweet 的多根节点遗漏宿主的正文间距与滚动。现已修复；独立 preview renderer 继续负责摘要。HTML 保持文本提取方式，Mail HTML 仍在原有隔离 iframe 中，不扩大外部 HTML 的执行权限。

最终源码通过 pnpm check。扩展验收夹具增加完整正文末尾、运行时 body-md 字号覆盖、真实 MF Twitter 根容器、直角业务容器、375px／1280px 页面与键盘操作验证，全部通过且 pageerror 为零。截图已逐张人工查看，产物和覆盖范围更新在 evidence/README.md；这些结果不替代真实 OAuth／下载后端集成证据。

本轮同时确认 `apps/client-webext` 不依赖 UI，仍使用自有主题和 Uno 配置；此前通过的 WXT 构建和 popup E2E 不代表其独立界面已采用 UI 2.0。本工作包当前迁移的直接消费者为 Web、mail、twitter、ext-dev-utils；浏览器扩展的主题接入应作为单独切片明确，不能继续笼统表述成整个 workspace 的视觉迁移全部完成。生产者 DESIGN.md 的直角默认和例外边界仍待用户确认，本轮没有将未确认的新品牌规则发布为既定契约。
