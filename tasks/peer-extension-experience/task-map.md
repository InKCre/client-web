# 工作地图

本任务有四个持续 Track。它们按用户任务和状态责任划分，而不是按文件夹划分；没有共同的实施 Phase，每个 Track 经 Human 复核后独立进入实现与验收。

```text
Peer 身份与生命周期
  ├─ 提供 Peers 页面和统一 Peer 展示
  ├─ 向 Extension selectors 返回“名称 + 应用版本”展示约定
  └─ 为 Schema 表单提供 Peer config 的真实消费面

Extension 发现与安装
  └─ 消费统一 Peer selector 展示，但安装本身不选择 Peer

Schema 表单
  ├─ Source 创建和编辑（共用 SourceForm）
  └─ Peer config 编辑

交互质量
  └─ 随前三个 Track 的真实页面修正，并在重复证据成立后沉淀标准
```

| Track                | 独立结果                                          | 主要依赖                                      | 集成返回                     |
| -------------------- | ------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| Peer 身份与生命周期  | Settings/Peers 分离、完整恢复、身份展示和状态刷新 | Hub Peer 契约、core-py 数据库权威、client-web | 统一 Peer 数据与展示语义     |
| Extension 发现与安装 | 浏览、搜索、Registry 一键安装                     | Registry API、现有 Extension runtime          | 与启用位置解耦的安装流程     |
| Schema 表单          | JSON Schema 驱动的可视化配置组件                  | 现有 UI 控件、Source/Peer schemas             | 两个真实消费者证明的共用组件 |
| 交互质量             | 更少说明文本、正确 dropdown、表单对齐和加载表现   | 各业务 Track 的具体页面                       | 只沉淀已重复出现的界面规则   |

## 顺序关系

1. Peer Track 先完成，因为它改变导航、Peer config 入口和 selectors 的显示数据。
2. Extension Track 消费 Peer 展示约定，但安装流程不等待 Peer 选择。
3. Schema 表单在 Source 与 Peer 两个消费者都清楚后实现，避免为单一页面过拟合。
4. 交互质量不是最终扫尾；每组实施时同步修正，跨页面稳定规律最后写入维护标准。
