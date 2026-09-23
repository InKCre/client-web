# LogsViewer

LogsViewer 按 `traceId` 读取并展示日志。首次读取后，以最后一条日志的 ID 作为游标追加新内容；只有收到新日志才滚动到尾部。

`enablePolling` 决定是否自动更新，`pollingInterval` 设置更新间隔（默认 5000ms）。尾部 spinner 只在请求期间显示，轮询间隔显示静态更新提示。读取完成但没有内容时显示空态。

读取失败时保留已显示的日志，暂停自动更新，并在尾部提供错误和重试。重试成功后按 `enablePolling` 恢复轮询。切换 `traceId` 会清空旧日志并重新读取；上一 trace 的未完成请求不能写入新的日志区域。

组件复用 Core 的 Log 模型和读取方法，错误详情可展开查看，单条日志由 LogEntry 渲染。
