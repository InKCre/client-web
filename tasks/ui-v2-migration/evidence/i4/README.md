# I4 验收

[源码与验收身份](delivery.json)，[本地完整新增旅程](local-browser.txt)。沿父目录 browser-host.mjs 重放；加 `--i4-only` 只运行本轮，加 `--deployed-extensions` 使用远端 Registry 与 MF 资源。

- Twitter：[应用保存失败](i4-twitter-application-failed.png)、[等待授权](i4-twitter-authorization.png)、[采集设置](i4-twitter-collection-375.png)、[完成摘要](i4-twitter-ready-375.png)。
- Mail：[宽屏阅读](i4-mail-1280.png)、[窄屏阅读与附件](i4-mail-375.png)、[邮箱事实](i4-mail-record-202.png)、[MIME 下载就绪](i4-mail-record-204.png)。
- Graph：[宽屏探索](i4-graph-1280.png)、[窄屏当前对象](i4-graph-375.png)、[关系详情](i4-graph-relation-375.png)、[无路径](i4-graph-no-path-375.png)。

截图使用浅深主题、375px／1280px，并关闭过渡动画；Graph 等待相机定位后截图。所有数据及凭据均为隔离夹具，日志中的 403 是主动拒绝注入。邮件白色区域是隔离后的消息文档，不继承宿主主题；完整地址与技术信息通过详情保持可达。
