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
