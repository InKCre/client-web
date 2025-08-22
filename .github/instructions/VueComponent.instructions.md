---
applyTo: 'src/components/**/*.vue'
---

所有的Vue组件都应该遵循该规范。

- 将单个的Vue文件拆分为下列文件，放在与组件同名的文件夹中
  - `<compName>.vue` 文件
  - `<compName>.scss` 组件级别的样式，通过 `@use` 在 `<compName>.vue` 中导入
  - `<compName>Types.ts` 组件级别的类型，包括组件属性类型、组件数据类型、常量等
  - `<compName>.md` 是该组件的文档
