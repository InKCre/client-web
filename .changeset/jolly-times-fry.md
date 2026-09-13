---
'@inkcre/client-web': patch
'@inkcre/ext-mail': patch
'@inkcre/ext-twitter': patch
'@inkcre/ext-dev-utils': patch
'@inkcre/core': patch
---

迁移至正式 @inkcre/ui-web 2.0.0，统一 Vue 最低版本、Token 角色、按钮提交与加载态、JSON 草稿保存和日期确认行为；维护 Agent 从安装包读取同版本 DESIGN.md 与 Skill。

Peer 保存现在传播数据库错误，配置保存失败时保留草稿与弹窗，阻止无效或尚在验证中的内容提交，并在持久化期间禁止重复操作。
