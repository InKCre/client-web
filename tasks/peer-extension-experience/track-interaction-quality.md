# Track：第四组交互质量

## 目标、状态与责任

本组将渐进式披露、Dropdown 可识别性和场景化加载落实到具体页面，并维护长期使用标准。本文是第四组的唯一范围与设计复核入口，父 packet 负责全任务编排。UI worktree 仅隔离生产者修改，不另立修复项目。

Human 已授权开始第四组实现。按本方案推进 UI 生产者、client-web 消费与 docs#31 更新；不授权合并 client-web#118。UI worktree 保留既有 Dropdown 修正，新增加载、Dialog 状态与 spacing；Web 在现有分支继续，不另起项目。交互草案见 [设计稿](interaction-quality-study.html)，它是独立静态示意，不是 InkUI 实例或产品验收证据。

Human 已认可场景化加载方向，并要求三点式加载继续实际使用，而非仅保留兼容接口；保存时只有保存按钮显示 loading，取消按钮不能显示 loading。导出内容无需额外说明：完整恢复是默认契约，仅真实存在的遗漏需要特别说明。以下方案与草案已按这三项意见修订，其余取舍仍沿本组复核流程。

## 调查依据

- 在已连接 Heroku/Neon 的 client-web#118 预览实际查看 Settings、Peers、Extensions、搜索首页；Create Source → Type 的顶部空白已在此前同一预览实测并验证过滤。
- Settings 的导出内容说明常驻，Peer ID 与语言夹在 Connection 表单中；语言实际立即生效，Save 只保存连接；Import 却共用 saving 状态，处理导入时 Save 按钮也会显示进行中。
- Peers 默认显示 UUID、能力数量；扩展 RSS 卡片常驻启用数量、卸载/换版前提及“文档暂不可用”；搜索首页常驻 LEXICAL RECALL eyebrow 与匹配规则说明。
- 源码确认 Peers 刷新期间保留数据，但刷新失败会以错误分支替换列表；Extensions 在刷新开始即隐藏卡片。Sources 保留列表数据，但读取提示另插入列表上方。
- Recall 的普通模式不渲染 pending/error；它先请求检索再导航，目标页面又会按 query 再请求。修改模式/关闭时也需防止旧请求结果改变新界面。
- LogsViewer 用 isActive || isLoading 显示动画，导致轮询间隔也一直播放；error 分支还隐藏已有日志。Job 详情先以 !job 显示 loading，未使用已有 error，因此 missing/error 不能落到正确界面。
- InkLoading 仅提供横排三个方块、size/density；尺寸为 5/12/18px，没有 reduced-motion。InkButton 已有文字旁 spinner 与 pending 禁用能力。
- InkDialog 将 isLoading 注入全部后代 InkButton；InkButton 把注入值与自身 isLoading 合并，同时用于禁用和动画，导致取消及其它非提交动作也转圈。这是共用组件的状态语义混合，不是各表单分别缺少取消按钮样式。
- ref.space 的五个值为数值并生成 px。Token 校验已接受 rem 字符串，生成器仅把数值 dimension 转成 px；无需新增转换机制。当前文档明确 rem 字号和比例行高，未实现相对 spacing。
- 已咨询 advisor，仅就加载能力和 spacing 范围获取独立判断；以下方案由主任务结合真实页面收敛。Job/日志及非默认等待状态的发现目前是源码证据，不能称为已完成浏览器复现。

## 1. 逐页面信息与操作设计

| 位置                          | 当前问题与原因                                                                        | 拟议调整                                                                                                                                                                                                                                                                                                                      | 验收重点                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Settings                      | 导出说明重复了完整备份的默认承诺；Connection 分区混有立即生效的 Language 和备份动作。 | 页面按 Connection、Language、Backup and restore 分组。Save 贴近连接字段；Language 沿用立即生效。导出/导入在备份区，删除内容清单，不新增“What's included?”入口或专用说明弹窗；只有真实遗漏才特别说明。Peer ID 收入 Connection details；Reset 放在备份区的次要位置，保留已有确认，不添加导出确认。                              | 导出仍包含密钥与完整浏览器配置；用导入恢复验证完整性，而非用解释文案弥补。                    |
| Settings 操作反馈             | 保存/导入均弹浏览器 alert；共用 saving 导致操作对象不清楚。                           | 用明确的当前操作区分 Save 与 Import pending，保持现有互斥约束；原位显示成功/错误，保留输入，错误技术细节按需展开。表单 max-inline-size 约 42rem、窄屏填满；Language 使用 InkDropdown，复用 InkForm 节奏。                                                                                                                     | 导入期间显示 Import 在处理；无全页遮罩、无“假保存”；失败可继续修正。                          |
| Peer 卡片                     | UUID、能力数量挤占默认层级；它们不属于识别和操作 Peer 的第一需求。                    | 名称、版本、This browser、状态及 Edit config/删除入口保留；UUID 和已有能力列表收入 Details。在线删除原因放在可聚焦的详情/帮助区域，不能只依赖 disabled 按钮的原生 title。状态默认中性色，失败消息另行强调。                                                                                                                   | 版本始终可见；详情可复制 ID；删除限制和既有 best-effort 行为不变。                            |
| Extension 卡片                | 常驻卸载/换版前提与文档失败，所有动作同层级。                                         | 保留名称/版本、Extension ID、启用数量、Enable/Disable、Setup（若有）、Edit config。Change version/Uninstall 收入 Version and removal 的 details，展开时把前提放在这两个动作旁，继续保留实际禁用约束。Help details 中列精确 Release 的 global/Core/Web 文档链接；文档加载、未发布或错误/重试只在此区呈现，打开文档仍跳转外站。 | 默认卡片没有大段解释；需要卸载或找文档时可直接找到原因或恢复操作；主操作失败不会被藏到 Help。 |
| Registry 回跳确认             | installedVersion 后再重复 alreadyInstalled；安装语义与 Host 信息分散。                | 保留昵称、精确 ID/版本、Host；合并为一条已安装提示。未安装时保留一句短的动作结果“安装后可在 Peer 上启用”，不展开协议解释。未连接、Release 读取失败、安装失败仍紧邻确认区域。                                                                                                                                                  | 不改变精确 Release 确认安装、打开链接不写入的契约；错误不冒充未安装。                         |
| Peer 启用/停用弹窗            | “next reconciliation”是实现词，不利于理解生效时间。                                   | 保留名称+版本、当前浏览器标记；需要 desired-state 路径的行显示短句“等待 Peer 同步”，只在选择这类 Peer 时显示一句生效说明。在线与离线继续使用当前服务端判定，不新增 running 数据。                                                                                                                                             | 用户理解提交意图与立即生效的区别；多选、部分成功与逐项错误仍清楚。                            |
| 搜索首页                      | eyebrow 与长匹配规则在默认界面占据注意，结果持续显示 resolver/rank 等技术数据。       | 删除 LEXICAL RECALL eyebrow；保留任务标题与示例性 placeholder。匹配规则放“搜索说明”details，默认区不再陈列长段文字。结果默认保留标题、摘要及有助理解的匹配类型；resolver、精确 rank、ID 放每条独立的 Details（与打开结果按钮并列，避免嵌套交互）。错误显示用户摘要、Retry 和可展开技术详情。                                  | 查询与结果打开/历史导航保持不变；检索算法与排序完全不变。                                     |
| Source 创建/详情、Schema 编辑 | 当前没有证据表明正常字段标签和校验应被收起；配置正文就是当前任务。                    | 保留名称、Type、配置字段、错误和提交动作；不为了减字隐藏必需信息。处理 Type 读取反馈及已确认 Dropdown 问题。Schema 的 description 先按真实长文例子核对，本组不批量折叠所有帮助或错误，也不顺带把 Job/Extension 全部改为可视化表单。                                                                                           | 草稿、切换校验、未知键保留等第三组契约继续成立。                                              |

先判断说明是否必要：默认行为本就应成立的承诺不另设帮助入口，不能把“渐进式披露”理解成把每句多余文字换到折叠区。确有按需阅读价值的小段说明使用原生 details；InkTooltip 只用于可选的短提示，不作为触屏唯一入口。不建设通用 Help/Popover/Wizard 框架，也不把插件文档内嵌进 Web。可操作错误、不可逆后果与影响当前选择的信息，在对应动作区域直接呈现。导出若提供完成反馈，保持简短，不重复内容清单，也不把已触发下载说成已确认写入磁盘。

## 2. 页面标题与浏览器 Tab 标题（Human 新增）

当前 App.vue 的 InkHeader 通过 createInkRouterAdapter 显示 route.meta.title 或路由名称，Sources、Peers、Extensions、Settings 正文又显示同名 h1。Header 已有 pageTitle 入口；浏览器 document.title 当前没有路由或对象数据更新逻辑，持续使用入口 HTML 的 InKCre。

### 可见标题

- Header 承担当前页面类别；删除 Sources、Peers、Extensions、Settings 正文重复的页面级可见标题，保留其创建、刷新等动作，重新安排顶部间距而不留空标题行。
- 详情的对象名称与章节标题仍有用途：Source 详情 Header 显示 Sources，正文显示 Source 名称；Connection、Backup and restore、日程、任务等是内容分区，不作为重复标题删除。首页的搜索任务提示也不等同于 Header 类别标题。
- 保持主内容区的可访问名称/标题层级；可用 main 的关联名称或屏幕阅读器标题，不为去掉视觉重复而让页面失去可识别结构。不借此改变 Header 的左右布局或品牌入口。

### Tab 标题规则

| 路由/状态                                         | 英文界面标题示例                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| /sources                                          | Sources - InKCre                                                                       |
| /sources/1，对象已读到                            | <Source Name> - Sources - InKCre                                                       |
| /sources/1，加载中、无昵称或读取失败              | Source #1 - Sources - InKCre                                                           |
| /peers、/extensions、/settings                    | Peers / Extensions / Settings 各自加 - InKCre                                          |
| /jobs/1                                           | Job #1 - InKCre                                                                        |
| /info-base/graph                                  | Graph - InKCre                                                                         |
| Block/Relation/Content 详情路由                   | Block #1 / Relation #1 / Content #1，加所属 Graph 类别（若在 Graph 中），再加 - InKCre |
| /extensions 的精确 Release 安装确认               | 已验证的 Extension 名称和版本 - Extensions - InKCre；读取前用 Extensions - InKCre      |
| 已连接的首页及无更具体页面信息时的默认值          | <Peer Name> - InKCre                                                                   |
| 未连接、尚未取得当前 Peer 名称或 Reset 后的默认值 | InKCre                                                                                 |

Peer Name 按当前 Web Peer（metaConfig.INKCRE_PEER_ID 对应的数据库行）理解；不任意选一个在线 Core 作为部署名称。Source 名称采用已加载/成功保存的数据，不随未提交草稿变化；无昵称用 ID 兜底。页面类别沿用 i18n，用户命名保持原文，InKCre 品牌固定。

实现责任留在 client-web：路由拥有静态类别和默认规则，详情页面复用已有读取结果提供对象名称，App 统一组合并更新 document.title。复用连接/恢复过程中取得的当前 Peer 信息及改名后的权威结果，不把名称新增成一份本地持久配置，不因每次导航另请求 Peer/Source。当前 configStore 只保留 Peer config，实施时需接通既有 Peer 身份读取结果，不把标题状态塞进 UI package 或 Peer config。

验收包含直接访问与刷新深链、路由前进/后退、对象名称异步到达、Source 保存改名、当前 Peer 改名、导入/Reset、语言切换以及快速从 Source A 切换到 B；旧请求不得把 A 的名称写到 B 或列表页。这里只跟随本浏览器已确认的数据，不新增跨浏览器实时改名同步协议。

## 3. Dropdown 与相邻表单修正

已确认问题是搜索区无可见线索，不再称为选项列表无故增加 padding。真实结构为 20px 搜索 input + 两个各 36px 的选项，面板 padding 为 0；输入 atom 能过滤为一个结果。

现有本地实现使用 sys-var(space, sm) 的 padding/gap、apply-icon(sm, true) 的 prefix 搜索图标，并提供键盘焦点。图标/留白的 mousedown 保持焦点至 label 激活输入，避免提前触发失焦关闭；保留输入内选词行为。实际 UI 构建验证了图标填色、过滤、Enter、Escape 及 360px 布局。归同一第四组，生产者目录为 /Volumes/WorkSSD/Development/.worktrees/ui-dropdown-search，分支 fix/dropdown-search-affordance。

本组使用以下具体消费者完成复核：

| 消费者                                       | 场景                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Create/Edit Source 的 Type                   | 无选择、长类型名、过滤无结果、选定后重新打开、Dialog 内展开。                           |
| Source 的 New collection → Collection intent | 一项/两项选项、键盘选择。                                                               |
| Extension 的 Change version                  | 异步版本读取、Core/Web 描述、失败重试、禁用与提交等待。                                 |
| Graph View options                           | Neighborhood size 与 Emphasize relations；右侧视口边缘、已有 details 内再次展开、滚动。 |
| Settings Language                            | 两个静态语言选项，尺寸与旁边 InkInput 相同，语言切换保持原语义。                        |

统一检查鼠标、Tab/上下/Home/End/Enter/Escape、窄屏和长中文。保留现有最大高度与滚动；只有实际复现遮挡/裁切后才调整定位或浮层机制，不先引入新浮层库。

Ctrl+K 已实测原生 input 42px、按钮 36px：用 InkInput 的现有控件度量（保留原生 search 语义）与 InkButton 对齐，宿主只决定输入列填充和动作列宽；两个模式复用已有 InkTabs。Info Base 首页输入/按钮都为 48px，不再作为错位缺陷。main 旧安装表单已移除，不继续修补旧入口。

## 4. 加载能力与实际使用规则

### UI 生产者拟议接口

- InkLoading 保留默认三点式 blocks，并继续用于内容区、图谱与预览的独立等待，不只是保留旧接口。新增 variant="spinner" 仅补充紧凑行内状态；size/density 沿用，新增可选 label 作为可见说明及状态名称，无 label 时保留 aria-label 入口。居中与留白由宿主内容区负责。
- 新增 InkSkeleton：只渲染一个直角、低对比的占位块，默认占满容器宽、高约一行文字；普通 class/style 定义具体宽高。组件拥有浅深主题颜色、缓慢透明度变化与 aria-hidden。列表和字段的骨架组合由实际页面负责，不提供业务模板或请求 props。
- InkButton 继续使用现有 isLoading；保留动作文字与防重复提交。InkLoading、InkSkeleton 和 InkButton 的等待动画统一响应 prefers-reduced-motion，停止动画但保留图形和状态文字。
- 分离 Dialog 的交互锁定与按钮自身 loading：提交期间沿用既有关闭/重复操作限制；默认确认按钮明确显示 loading，取消按钮只按需要 disabled，不显示 loading。自定义 footer 同样由实际提交动作持有 loading，不能由 Dialog 向全部按钮广播动画；不增加逐个 Cancel 关闭动画的补丁属性。修改前核对全部注入消费者与公开契约，同步默认 footer、Promise Dialog 和自定义 footer 示例。未实现请求取消的场景不把 Cancel 伪装成可中止保存。
- 调整本组触及的 Loading 度量为相对单位/已有 Token，采用语义颜色；不新增同义 Token，不创建异步请求框架、全页遮罩 API 或假进度百分比。

| 实际位置                                         | 视觉安排                                                                                                | 状态行为                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Peers / Extensions / Sources 首次列表读取        | 2–3 个简化条目骨架：名称短条、摘要/标识长条；使用真实列表的外边界与间距，不画可点击假按钮。             | 标题、导航及适用的创建/浏览入口保留。已连接但空数据只能在读取完成后显示空态；未连接直接给 Settings 入口。                                   |
| 上述列表刷新                                     | 原卡片保持，Refresh 或局部行内 spinner 表示更新。                                                       | 失败时保留已有数据与展开状态，附错误+重试；首次失败才显示整区错误。不能只在 pending 保留、error 又清空。                                    |
| Registry 回跳读取 Release                        | 标题、精确坐标与 Host 行的骨架。                                                                        | Release 可供确认后才呈现安装动作；不展示假的可用安装按钮。                                                                                  |
| Source 详情首次读取                              | 返回入口保留；标题与元信息骨架。                                                                        | schema 未知时不假造配置表单。日程/任务各自局部加载，刷新保留已有条目。                                                                      |
| Type/版本等选项读取                              | 字段附近小 spinner + “读取类型/版本”。                                                                  | 标签、当前值和取消保留；失败显示该字段的错误与重试；停止等待后解除相应禁用。                                                                |
| Graph、SolvedContent、BlockNode 预览             | 内容区/节点内使用三点式 blocks，按容器使用现有 size/density，必要时配短说明。                           | 数据结构未知，不伪造文章或图节点。保留对象标题与关闭动作；本组不改 Resolver dispose 生命周期来强行保留旧内容。                              |
| Block/Relation 详情侧栏                          | 有固定结构的标题/属性行骨架，保留关闭。                                                                 | missing 与失败区分；失败提供对应读取重试，原始错误按需查看。                                                                                |
| 搜索首页/Find path 结果                          | Search 按钮 pending，结果区最多三个标题+摘要骨架。                                                      | 新查询不显示旧查询结果冒充新结果；无结果与失败均停止动画，失败保留查询。                                                                    |
| Settings 保存/导入、安装、Peer 启停、Source 保存 | 只有正在执行动作的 InkButton 显示 pending 图标；保存时 Save disabled + loading，Cancel 不显示 loading。 | 输入/已选项保留，阻止重复提交；不可中止的提交期间 Cancel 可禁用，失败后恢复操作。反馈附着于动作，不遮住全页，不把失败误示为成功。           |
| Job 详情/日志                                    | 首次详情骨架；单个 Source 元信息独立等待；追加日志只在尾部显示小 spinner。                              | Job 必须先区分 loading/error/loaded，不能用 !job 无限等待。轮询间隔显示静态“自动更新中”；请求期间才显示动画，失败不隐藏旧日志，并提供重试。 |

不为避免快请求闪烁先增加延迟显示/最短显示时长；先验证真实等待。如出现可复现闪烁，再按证据处理。每个等待区域只有一个可访问状态播报；骨架条本身不逐条播报，刷新不抢焦点。

### Recall 请求责任的具体调整

普通 Recall 只提交 query 并导航，由目标 List/Graph 的现有读取流程拥有数据请求及结果加载；删除当前“先检索一次，导航后再检索”的重复等待。Find path 仍由弹窗自己检索端点：按钮 pending、错误+重试、无匹配状态完整呈现。切换模式或关闭时使当前结果失效，避免旧请求在新模式下触发导航；沿用现有 generation 机制，不另建取消/请求框架。该改变不涉及检索协议或后端。

## 5. Spacing 的具体提案

建议本组一并把五个 ref.space 源值改为 rem：xs=0.25rem、sm=0.5rem、md=1rem、lg=2rem、xl=3.5rem。保持 Token 路径、sys 引用、Sass/Uno 用法不变；16px 根字号时与当前值等大，根字号变化时统一调整间距。选择 rem 而非 em，是为了同一间距不受组件嵌套字体大小重复放大。

现有校验和生成器接受这些值，因此不增加自动换算器或单位配置。更新 Token 维护说明、迁移说明、已有导入夹具对“以既有单位表达值”的示例及生成产物，验证 Figma 值导入仍不能悄悄把相对单位改回 px。

该调整影响全部 sys.space 消费者，不只是 Dropdown。验收需覆盖 InkForm/Input/Button/Dropdown/Tabs/Dialog、Schema 表单、Header，以及 Web 的设置/列表/弹窗；根字号 16px 对照旧尺寸，20px 检查间距联动与换行。边框、阴影、断点、Graph 坐标及全部 ref.size 不在本次迁移中。

## 6. 实施、验收与长期标准

统一按第四组交付，不将每个局部修正独立推进为新项目：

1. 在现有 UI worktree 完成 Dropdown、Loading/Skeleton、Dialog/Button 状态职责修正和 spacing；同步既有 Story、迁移文档、Changeset 与完整 pnpm check。先用实际 Story 构建检查组件，再以 client-web 源码联调检查真实容器，明确非正式依赖证据。保存/取消检查覆盖默认 Dialog、Promise Dialog、自定义 footer（Peer/Extension 配置及启停）和 Source 表单：只让执行中的动作转圈，提交锁定与失败恢复不回归。
2. client-web 在 PR #118 的当前分支按上述页面清单实施，使用现有 UI 能力和批准的新公开接口；不混入第一方 Extension setup 内部重写。
3. 按既有正式发布流程交付 UI 后，client-web 统一消费正式版本，更新原 PR。发布/合并沿既有授权边界，不从工作分支直接发布；docs#31 保持开放。
4. 验收覆盖实际等待约 1–2 秒、成功、空结果、失败、重试，以及有旧内容的刷新失败。已存在数据库 E2E 中补有价值的回归：Recall 请求责任/失效、Job 失败退出等待、日志失败保留内容；纯间距/图标不逐条新增自动化测试。用户真实部署只做授权范围内的操作，失败/延迟用隔离环境控制，不破坏用户部署。
5. 桌面浅色 1280×720 或 1440×900 截图用于前后比较与 docs；360px、中文长文、键盘、reduced-motion、20px 根字号作专门验证。截图放父 task packet 的 assets 并局部忽略，不提交；页面步骤变更同步 docs#31。
6. UI 的 docs/design/composition.md 沉淀“删除不必要的说明，再按当前任务披露”“结构明确用骨架、独立内容等待保留三点式、紧凑行内等待用 spinner、已有内容刷新保留”“禁用不等于正在执行”的标准，组件 Story/说明拥有 API 与状态示例，skill.seed 同步生成消费者指南。client-web 的状态行为留在代码和必要回归中，组件说明只记录业务差异，不复制一套设计系统。

以上方案已进入实施。尚未写完的“还存在一个”保持待补充，不据此阻塞已明确范围，也不自行猜测。

## 实施与交付状态

UI 生产者已提交为 `0b5d9da`，Draft [ui#54](https://github.com/InKCre/ui/pull/54)。完整 `pnpm check` 通过；主代理在实际 Story 构建复核了自定义 footer 保存期间仅保存转圈、取消禁用、Escape 锁定，以及失败保留草稿、重试成功。生产者另验证 Loading 的作者提供状态名称，不能把辅助树检查声称为屏幕阅读器语音实测。

Web 已接入新的界面分层、默认 Header 去重、动态 Tab 标题、Loading/Skeleton、刷新失败保留和恢复入口。当前通过显式 UI source lane 验证，未把未发布包写入 manifest/lockfile。首页名称复用启动注册结果；Settings 成功连接后的运行时返回值不包含 Peer，因此此处只额外读取一次当前 Peer 来更新非持久身份，未为显示标题改变 SDK 公共返回类型，也不逐路由请求。读取名字失败只退回 InKCre，不影响已保存连接。

源码联调类型检查、格式与 lint 通过。隔离数据库首批 11 条 E2E 已通过，包括空浏览器首次连接与刷新、默认/自定义 Dialog 的取消不转圈、Recall 一次请求与失效、Job 失败/missing、日志失败保留。扩展后的 12 条整轮为 8 条通过、4 条因源码开发服务器模块请求 502 失败；新增 Source 名称/草稿/保存/历史/刷新、首页 Peer 名称与 Peer 刷新失败保持详情均已在该轮通过。再次整轮运行在准备数据库时遭遇 Colima Docker API 无响应，未进入测试；因此不能把分轮证据表述为最新完整 12 条通过，也未修改产品或测试来掩盖环境失败。日志保留于 ignored assets，正常依赖的完整重跑仍待完成。任务与日志模型在现有读取边界传播真实请求失败，Job 不存在返回既有 APIError 的 404；不改变 Peer 或数据库协议。

已查看 1280×720 浅色 Settings 与 Dropdown、360px 换行；桌面原图在 ignored `assets/group4-settings-desktop.png`。临时浏览器视口已恢复。docs#31 的连接、扩展版本管理与任务观察步骤已本地同步，站点完整 check 通过；正式包与公开 preview 截图待交付后更新。UI PR #54 的 CI 与 Pages 构建均通过。UI 正式发布需要独立授权，已提出；client-web#118 与 docs#31 不合并。源码联调证据不替代正常锁定依赖构建、CI 与公开 preview 验收。深色、reduced-motion、20px 根字号及全部 Dropdown 消费场景的浏览器矩阵仍需补完。
