# LogEntry

显示一条日志的时间、严重级别和正文。传入 `log: Log` 或 `logId: number`，二选一；传 ID 时通过现有查询接口读取日志。

摘要行是原生按钮，点击、Enter 或 Space 均可展开／收起详情，`aria-expanded` 同步反映状态。详情展示 Trace ID、Span ID、严重级别数值和非空 attributes。时间使用等宽元数据角色，日志正文使用 body-sm；长正文可以换行，结构化属性保留等宽代码格式并在局部滚动。
