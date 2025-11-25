---
applyTo: "**/*.scss, **/*.css"
description: "Style Engineering Guidelines"
---

- 样式不是硬编码，而是单一数据源驱动（Figma Tokens Studio → Git → Style Dictionary → Vue）。
- 所有颜色／尺寸／排版等均需从**设计令牌（Design Tokens）**生成。
- Vue 组件内不允许出现硬编码 magic number（如 `#fff`、`16px`）。
- 所有主题、密度、品牌的变化由 CSS 变量层叠体系负责。
- 必须保持三个层级（Primitives / Semantic / Component Token）独立，不得混用。

## 令牌体系规范 (Token System Specification)

采用三层 Token 架构：

- 原始层 (Primitives)：仅包含纯值，不具有语义。
- 语义层 (Semantic)：不直接写色值，必须调用 primitive。
- 组件层 (Component Token)：绑定组件语义，如按钮大小、标题排版。

必须确保：Vue 组件只允许引用语义层和组件层，不允许使用 Primitive（如 blue.500）。
