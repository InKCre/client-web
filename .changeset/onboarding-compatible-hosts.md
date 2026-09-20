---
'@inkcre/ext-twitter': minor
'@inkcre/ext-mail': minor
'@inkcre/client-web': patch
---

将 Twitter、Mail 浏览器发行分别对齐到支持 Core Host 0.2 的既有 Python 发行 0.4.0、0.3.0。Web 安装和显式换版本交由所选 Host 校验，使 Python-only Extension 可以从 Web 安装。首次连接成功后再启动浏览器任务扫描，重置时先停止任务。
