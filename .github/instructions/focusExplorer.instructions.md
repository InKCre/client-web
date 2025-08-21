---
applyTo: 'src/components/focusExplorer/*'
---

FocusExplorer 是专注聚焦的浏览、编辑块与关系的组件。

## 功能

## 界面设计

- 基础布局是宽度比为2:1的两栏
- 第一栏内是聚焦块的 BlockEditor
  - BlockEditor 下方有一条操作栏，有“跳转”、“前进”与“返回”按钮
- 第二栏内是 RelationViewer(to=true) 包裹的 BlockViewer 的列表，负责显示聚焦块的出向关系及其连接到的块
