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

以下为首次视觉复审后的构建，取代首轮产物哈希；后续 I1 的变化见文末。构建目录按相对路径排序，依次拼接「路径、NUL、文件内容、NUL」计算 SHA-256，包含 source maps：

| 产物                    | 文件数 | SHA-256                                                            |
| ----------------------- | ------ | ------------------------------------------------------------------ |
| Web dist                | 11     | `dbebfdbc2c6a93cbcf342e7d432fa58950af61a305595f77f25f680bb8670904` |
| mail dist/client-web    | 44     | `e8b1f1a71c313e3ab12995d7c85b991fb83c5280d43557988d2337f69542ccc3` |
| twitter dist/client-web | 47     | `b611416d626f44bdc13f99e65787df55acad16713b95c96881965389988f6891` |

## 视觉复审补验

首轮验收证明 API 与交互可用，未覆盖完整设计迁移。本次重放脚本增加以下观察边界，并逐张复查截图：

| 页面或边界                | 实际检查                                                                                          | 证据                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Mail 正文与附件           | 保留 iframe 隔离；长附件名换行；直角附件容器；下载 pending 和失败恢复，错误使用反馈前景           | [窄屏 Mail](mail-host-dark-narrow.png)                                |
| Text／HTML 文本／Tweet    | 打开后能够读到完整正文末尾；覆盖 body-md 字号为 21px 后跟随变化；Tweet 根节点接收宿主的间距与滚动 | [窄屏 Tweet](tweet-host-dark-narrow.png)                              |
| 搜索                      | 真实 Host 调用隔离检索响应，结果标题、正文和元数据按角色显示，结果按钮与输入使用直角              | [窄屏结果](search-dark-narrow.png)                                    |
| Sources／Source 详情      | 1280px 并排、375px 换行；长名称、配置及操作没有横向裁剪；Enter 激活详情链接；配置弹层位于视口内   | [宽屏](sources-1280.png)、[窄屏](sources-375.png)                     |
| Job／Logs                 | 元数据和日志按容器换行；Enter 展开原生日志按钮并更新 aria-expanded，结构化属性可局部滚动          | [窄屏日志](job-375.png)                                               |
| Extensions／Twitter setup | 安装与扩展列表可换行；Host 与 MF remote 的中文时间草稿交互继续通过                                | [窄屏扩展](extensions-375.png)、[时间选择器](twitter-time-picker.png) |

复审后的 `pnpm check` 和浏览器重放均通过，pageerror 为零。Settings、Peer、Mail 事实与 MIME 局部视图、ext-dev-utils 开发页的字体／形状调整经过源码核对及完整构建；本轮没有为每个局部视图另造浏览器页面。旧 Peer 截图仅保留首轮保存交互的证据，不作为更新后视觉样式的截图。

本阶段步骤编号仍保留圆形，生产者当时尚未确认直角默认和例外；这一历史边界已由文末 I1 更新。Mail iframe 的白色底属于外部邮件文档边界。浏览器扩展 client-webext 使用自有主题而非 UI 依赖，本轮没有迁移该独立主题。

Recall 浮层同样补验了 375px 下的检索结果、Escape 关闭与容器宽度，见 [窄屏 Recall](recall-dark-narrow.png)。Job 状态 JSON 的等宽字体也通过实际 computed style 验证。

## I1 已确认风格的实现对齐

2026-09-13，按与用户确认后的共同轮廓，Twitter 步骤编号改为直角；窄屏复核同时修复了向导宽度未受宿主内容区约束、关闭按钮被裁剪的问题。新的 [375px 向导](twitter-steps-375.png) 展示完整的关闭按钮、两列步骤和可换行的配置内容。

最终完整 `pnpm check` 与上述浏览器重放通过。夹具新增四个步骤、唯一当前状态、直角编号、375px 容器无横向裁剪和关闭按钮完整可见的检查；时间草稿取消／确认及其余已有旅程继续通过，pageerror 为零。本地采用 Chromium 149.0.7827.55，未进行真实 OAuth、扩展发布或生产部署。

Web 与 Mail 产物和上表一致；Twitter 构建仍为 47 个文件，新的 SHA-256 为 `7a1156f93e543a8a4be79e2c80a4cfa437a72d6cab00d795578018981d01e3bb`。UI 依赖仍是 registry 2.0.0，没有启用源码映射；这些检查验证消费者局部修正，不宣称已安装生产者分支中尚未发布的字体和文档更新。
