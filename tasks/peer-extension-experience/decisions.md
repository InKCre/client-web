# 已确认决定

## 2026-09-22：工作分组

- **决定者**：Human。
- **决定**：任务采用 Peer 身份与生命周期、Extension 发现与安装、Schema 表单、交互质量四个 Track；逐组复核和实施。
- **原因**：每组对应一个用户任务或稳定责任边界，可以独立验收；不把全部问题变成一次 UI 重写。

## 2026-09-22：Settings 与 Peers

- **决定者**：Human。
- **决定**：Settings 仅包含元配置和本地配置；Peers 包含当前 Peer 与其他 Peers。Registry URL 属于 Peer config，因此只能从 Peer 管理入口编辑。
- **后果**：现有 Settings 中的 Peer config 和 PeerList 都要移出；Settings 仍是未连接或连接损坏时可进入的恢复面。

## 2026-09-22：完整导出

- **决定者**：Human。
- **决定**：Settings 导出文件必须能在另一浏览器完整恢复本浏览器体验，包括密钥；不增加额外安全设计。
- **后果**：验收以干净浏览器恢复后的实际持久体验为准。数据库权威状态通过同一部署和 Peer 身份重新读取，不复制成第二份配置权威。

## 2026-09-22：术语

- **决定者**：Human。
- **决定**：表示 InKCre 运行节点时，界面与代码使用 Peer，不再以 client 作为产品同义词。
- **例外**：`client-web` 包名、HTTP/database client、OAuth Client ID/Secret、Web API 属性及真正的第三方客户端保持原词。

## 2026-09-22：Schema 表单

- **决定者**：Human。
- **决定**：基于 JSON Schema 的可视化表单是 Source 创建与 Peer config 编辑共用的组件目标。
- **后果**：表单对齐问题按全站调查，不局限于已报告的“安装插件”和“搜索信息”。
