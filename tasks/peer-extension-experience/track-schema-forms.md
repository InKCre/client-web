# Track：Schema 表单

## 目标

提供一个基于 JSON Schema 的可视化表单组件，由 Source 创建/编辑与 Peer config 编辑共同使用；用户不必直接编辑 JSON。

## 已确认边界

- 这是明确的共用组件目标，不是某一页面的临时表单。
- 必须以 Source 与 Peer 两个真实 schema 消费者校验字段类型、必填、默认值、嵌套结构和错误反馈。
- 优先复用现有 UI 控件和依赖；不为尚未出现的 schema 特性预建渲染框架。
- 表单布局对齐要调查实际报告的安装 Extension、搜索信息及其它表单；它不是本组新表单天然产生的问题。

## 实施与验证

- `SourceForm` 同时服务 Source 创建和编辑，`PeerCard` 服务 Peer config 编辑；两处目前都用 `InkJsonEditor`，已有稳定的提交入口，可以共同验证表单组件。
- 已安装的 `@inkcre/ui-web` 提供 `InkAutoForm`，但其公开契约只支持扁平的 string、number、integer、boolean 字段；`InkJsonEditor` 是原始 JSON 草稿编辑器。
- Core Peer schema 是两个可空 URL 字符串；Web Peer schema 包含嵌套 AI 对象及 provider 对象数组。Source 的 GitHub、Telegram、RSS 配置主要是扁平字段，Mail 配置含嵌套连接参数、可空对象、字符串数组与 `$defs/$ref`。因此现有 `InkAutoForm` 无法覆盖两个真实消费者的完整变化范围。
- UI 包扩展既有 `InkAutoForm` 的实际 schema 子集，Web 负责业务字段组合、提交与错误反馈；保留原始配置值和未知键，不在切换表单时丢失数据。遇到无法可靠表达的 schema，不开放可能丢字段的可视化提交，进入仍可验证、保存的 JSON 编辑模式。
- `InkAutoForm` 当前自身渲染 `<form>`，`SourceForm` 也使用 `InkForm`。直接嵌套会产生无效的嵌套表单；实施前需给 AutoForm 一个能嵌入现有表单的窄接口，或等价地调整字段渲染边界，并保留原生提交语义。
- 配置含 GitHub/Telegram/Mail 凭据与 Web Peer AI provider API key，但现有第一方 schema 未标记这些字段的显示用途。可视化控件不能仅凭字段名猜测“密码”；若要遮蔽输入，需要由 schema 提供显式 UI 注解。这是显示语义，不替代配置存储的安全边界；不能误用标准 `writeOnly`（它承诺读取时不返回值，而当前配置可读取和完整导出）。

## Human 已确认的范围

- 组件支持的首批结构：嵌套 object、nullable、本地 `$defs/$ref`、primitive 数组和对象数组，以及已有 primitive 字段与 enum。仅支持足以覆盖真实 Schema 的已知子集，不承诺完整 JSON Schema。
- Source 创建与 Peer config 编辑同时迁移；Extension config、Job config 在两个消费者验收后再按同一能力评估，不借此预建完整 JSON Schema 渲染框架。
- Source 创建与编辑都经同一个 `SourceForm`，必须一起验收；Peer config 包含当前 Web Peer、Core Peer 与其他 Peer。可视化/JSON 共用同一配置草稿，单纯切换视图不改变配置或清除无效 JSON。无法可靠渲染的 schema 转入保留完整验证与保存能力的高级 JSON 模式，不能因视觉模式不支持而锁死编辑。
- 页面级表单对齐、dropdown 和 loading 的问题继续记入交互质量 Track；本组仅处理 Source、Peer 新表单实际出现的布局问题，不预设一定会出现。
- 可视化表单与高级 JSON 编辑若采用 Tabs 切换，在两个消费页面使用 UI 包同一个受控 Tabs；组件负责选项、选择状态和键盘交互，不拥有 Source/Peer 提交逻辑。选中状态可来自本地状态或路由；路由变化由消费者处理，Tabs 本身不依赖 vue-router。
- 建议同时用现有 Extensions Installed/Discover 同页切换作为路由型 Tabs 的真实验收面：当前它由同一路径的 query 参数决定视图。若采用，必须保留 `RouterLink` 的真实链接与浏览器前进/后退，不在 UI 包内引入 vue-router，也不另建一份选中状态。

## 验收结果

- `SourceForm` 的创建和编辑共用同一编辑器；Core Peer 和 Web Peer 配置均以可视化表单打开。JSON 模式中无效草稿不会被切换抹去，保存保持禁用并给出原因。切换模式与修改已知字段后，未知配置键仍存在。
- Histoire 核对嵌套对象、数组、nullable 与密码遮蔽；UI `pnpm check`、client-web `pnpm lint` 和 `pnpm type-check:ui --ui-source ...` 通过。Core 第一方 Source schema 的 `format: password` 与 UI 渲染兼容；本地运行的旧 Core 尚未包含此提示，线上出现遮蔽需待该版本交付。
- Extensions 的路由型 Tabs 保留 query 状态和浏览器前进/后退。Source 创建入口只渲染一个原生 form。验收时暂时启用既有 GitHub Extension 后已恢复关闭，没有创建 Source 或保存 Peer 配置。
