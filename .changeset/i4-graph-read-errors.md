---
'@inkcre/core': patch
---

Block.find 传播数据库读取错误，避免 Graph 与 inspector 将读取失败误报为对象缺失。成功读取但没有匹配对象时仍返回 null。
