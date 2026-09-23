# Track：交互质量

## 目标

让相关页面通过渐进式披露、正确的控件布局和因地制宜的加载反馈保持简洁、易读和可操作。

## 已确认边界

- 减少说明文字不等于删除完成任务所需的信息；细节按需展开或链接文档。
- Dropdown 的宽度、定位、选中值和窄屏表现要在真实消费者中检查。
- 加载反馈按等待对象选择：页面首次读取、列表追加、按钮动作和后台刷新不强制使用同一种样式。
- 不先创建设计系统或 Loading/Wizard 抽象；在多个真实页面重复出现稳定规律后再沉淀标准。

## 表单布局审计（2026-09-23）

- client-web#118 预览中，Ctrl+K 快捷搜索的输入框高 42px、按钮高 36px，居中排列导致按钮上下各缩进 3px；桌面及 320px 均复现。根因在 `RecallSearch.vue` 的原生输入 padding 与按钮尺寸组合，可由该表单的对齐规则修复。
- Settings 两个 `InkInput` 字段各高 60px（20px 标签、4px 间距、36px 控件），Language 原生 label/select 字段高 66px（24px 标签、4px 间距、38px 控件）；桌面及 320px 节奏不一致。已有 `InkDropdown` 可以承载静态语言选项，无须新 UI API。
- Info Base 首页搜索输入与按钮均高 48px，已对齐；Source 创建弹层的输入、下拉和 JSON 编辑器等宽，操作按钮右对齐，桌面及 320px 无溢出。不可把它们列为缺陷。
- Human 指的安装表单是 **main** 上的旧手工安装入口，而此前审计误查 client-web#118 的新发现页。`app.inkcre.dev/extensions` 桌面实测：旧表单两个输入控件外框左边线 x=48、宽 560px；`.footer` 同样从 x=48 开始，但按钮左边线 x≈461。`origin/main` 的 `.footer` 用 `justify-content: flex-end` 并有 `space-sm` 内边距，明确造成右置及右边缘再内缩；这不是 InkInput 自身宽度错误。
- client-web#118 已删除旧手工安装组件，改为 Discover 详情里的 Version 与安装按钮同排。该新布局尚未在可用 Registry 的 PR preview 视觉复核；不能把 main 的修复或 main 旧表单的测量套用于新布局。应按 Human 指出的“提交动作与相关控件左边线形成稳定关系”重新评估新流程。
- Peers 配置、Source 编辑/Job/Cron、Extension 配置/版本对话框在预览中因未配置 Peer/Registry 无法进入；静态检查显示字段后提交或 Dialog footer，没有新的同类错位证据。
- 第三组正式包的公开 PR preview 未连接用户部署，Peers、Sources、Extensions 与 Graph 会显示底层 `Failed to construct 'URL': Invalid URL`。这不是联网配置编辑的验收环境；交互质量组应检查未连接状态是否给出面向用户的连接入口，而非暴露底层 URL 异常。

## 下一步

先在宿主页面修复 PR preview 的两处实测错位，并把 main 旧安装表单作为根因证据而非继续维护的入口；PR #118 已移除它，无须给即将删除的组件单独补丁。UI 包拥有控件自身的响应式/填充容器行为、字段内部结构和相对性 Token；`InkForm` 已提供纵向字段节奏与字段 layout 上下文。宿主决定任务分区和容器尺寸，但应优先消费既有组合能力，不在每页重复规定字段内部布局。PR #118 Extension 安装使用自定义 grid 而非 `InkForm`，Settings 又重复声明 InkForm 的 flex/gap；新安装表单应在真实 Registry 场景核对 Version 控件和按钮的水平关系，再决定是否改为 InkForm 的纵向提交组合。当前没有第二个“带标签/错误的字段＋并排操作”消费者，不给 `InkField` 预加 `actions` 插槽；若此组合重复出现，再以标签、控制、操作、错误的关系扩展它。

UI 包可按实际消费增加轻量 Tabs：Schema 表单的可视化/JSON 切换首先提供两个消费场景。Tabs 选中态由消费者控制，可来自本地或当前路由；路由变化不排除 Tabs 语义，但路由导航须保留真实链接及前进/后退行为。现有 Extension 页是否迁移，按其关联内容与链接行为判断，而非只看 URL 是否变化。
