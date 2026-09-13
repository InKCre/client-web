# SourceCard

展示一个 Source 的类型、昵称、配置摘要和操作。传入 `source: Source` 或 `sourceId: number`，二选一；传 ID 时组件读取对应对象。

类型名称使用原生链接进入来源详情，正在执行的任务也提供独立链接。昵称编辑、配置确认和 Run Now 由组件处理；卡片外壳仅负责分组，避免将包含按钮和输入框的整张卡片作为唯一导航入口。操作在窄容器中换行。

配置弹层使用 JSON 文本草稿。只有当前草稿通过校验后才能确认；保存期间禁止编辑和关闭，失败保留草稿并显示错误。删除先二次确认，再发出 `delete(source: Source)`，由父组件执行删除和刷新。现有 `editConfig` 事件声明没有实际触发，调用方不应依赖它观察保存完成。

```vue
<SourceCard :source="source" @delete="onDeleteSource" />
```
