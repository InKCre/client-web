# @inkcre/core

## 0.3.0

### Minor Changes

- 47fa3f6: 支持 Job 的 best-effort 停止意图：worker 集中读取 abort_requested，传递 AbortSignal，并在执行与清理结束后关闭 Job；应用退出先等待 worker 再释放 Extension runtime。

### Patch Changes

- ec5dd1e: Block.find 传播数据库读取错误，避免 Graph 与 inspector 将读取失败误报为对象缺失。成功读取但没有匹配对象时仍返回 null。
- ec5dd1e: 迁移至正式 @inkcre/ui-web 2.0.0，统一 Vue 最低版本、Token 角色、按钮提交与加载态、JSON 草稿保存和日期确认行为；维护 Agent 从安装包读取同版本 DESIGN.md 与 Skill。

  Peer 保存现在传播数据库错误，配置保存失败时保留草稿与弹窗，阻止无效或尚在验证中的内容提交，并在持久化期间禁止重复操作。

  Host 与扩展共享 UI 运行时以继承 i18n、路由和表单上下文；Info-Base 浮层与 Mail 附件操作适应窄视口。

  移除普通业务容器的旧圆角，按正文／标题／元数据职责使用字体角色，调整 Sources、Extensions 和 Job 详情的布局以适应容器宽度。打开的 Text、HTML 文本和 Tweet 内容不再沿用摘要截断。

- ec5dd1e: 来源列表集中展示名称、类型、ID 与当前采集入口；完整配置和删除集中到详情，创建来源与定时采集表单由明确动作打开。配置使用独立草稿，读取失败、schema 不可用、保存／删除等待和失败均有对应反馈，离开前保护未保存修改。

  Source、SourceType 和来源页使用的 Job／Cron 数据库边界传播请求错误，避免把失败显示成空结果或删除成功。普通任务状态与例行保存采用中性表达，失败与超时继续强调。

  Twitter 设置向导在来源切换读取失败时保留之前的来源与时间草稿，并显示错误，避免选项与实际采集目标不一致。

  Web 注册同版本 UI Uno preset，让已有语义反馈工具类实际生效；来源创建与任务配置弹层的宽度受视口和宿主容器共同约束。

## 0.2.0

### Minor Changes

- d72d88c: Add peer-local graph-navigation retrieval and the required Resolver preview presentation contract.
