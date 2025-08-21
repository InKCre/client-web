---
applyTo: 'src/components/*.vue'
---

所有的Vue组件都应该遵循该规范。

- 使用和组件同名的文件夹来存放组件相关文件，包括：
  - `<compName>.vue` 文件
  - `<compName>.scss` 组件级别的样式，通过 `@use` 在 `<compName>.vue` 中导入
  - `<compName>Types.ts` 组件级别的类型，包括组件属性类型、组件数据类型、常量等
