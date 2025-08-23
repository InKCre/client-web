---
applyTo: 'src/components/**/*.vue'
---

所有的Vue组件都应该遵循该规范。

将单个的Vue文件拆分为下列文件，放在与组件同名的文件夹中：

- `<compName>.vue` 文件
- `<compName>.scss` 组件级别的样式，通过 `src='./<comName>.scss'` 在 `<compName>.vue` 的style块中导入
- `<compName>Types.ts` 组件级别的类型，包括组件属性类型、组件数据类型、常量等
- `<compName>.story.vue` 组件预览文件
- `<compName>.md` 是该组件的文档，包含组件的属性、功能、界面设计等

## 阅读组件文档

- `comp:<CompName>` 代表 `src/components/<compName>` 这个组件；可以使用 `(<param_name>=<param_value>)` 的方式指定参数
