---
'@inkcre/client-web': patch
'@inkcre/ext-mail': patch
'@inkcre/ext-twitter': patch
'@inkcre/ext-dev-utils': patch
---

升级正式 @inkcre/ui-web 至 2.0.1，采用更新的设计指南、字体与中性色彩，并修复默认 Header 菜单图标不可见的问题。Web 与两个 Module Federation 扩展使用同一精确 UI 版本，不添加本地主题覆盖或图标 safelist 补丁。

侧栏宽度计入内边距与边框，避免窄屏打开菜单时被裁切。
