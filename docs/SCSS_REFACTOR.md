# SCSS 样式系统重构文档

## 概述

本项目的样式代码已经完全重构为使用 SCSS，并建立了一个系统化的设计系统。

## 文件结构

```
src/styles/
├── main.scss           # 主入口文件
├── base/               # 基础样式定义
│   ├── _color.scss     # 颜色系统
│   ├── _space.scss     # 空间和尺寸系统
│   ├── _typography.scss # 字体系统
│   ├── _elevation.scss # 阴影和立体感
│   └── _shape.scss     # 形状和边框
└── utils/              # 工具和混合样式
    ├── _variables.scss # 全局变量
    └── _mixins.scss    # 混合样式
```

## 设计系统

### 颜色系统

```scss
// 主色调 - 黑白灰系统
--color-primary: #000 --color-primary-light: #333 --color-text: #000 --color-text-muted: #666
  --color-background: #fff --color-background-soft: #fafafa --color-border: #e0e0e0;
```

### 空间系统

```scss
// 标准间距
--space-xs: 4px --space-sm: 8px --space-md: 12px --space-lg: 16px --space-xl: 20px --space-2xl: 24px
  --space-3xl: 32px --space-4xl: 48px;
```

### 字体系统

```scss
// 字体族
--font-mono:
  'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New',
  monospace --font-system: system-ui, -apple-system,
  sans-serif // 字体大小
  --font-size-xs: 8px --font-size-sm: 9px --font-size-md: 10px --font-size-xl: 12px
    --font-size-2xl: 14px --font-size-3xl: 16px;
```

## 主要 Mixins

### 布局 Mixins

```scss
@include flex-center; // 水平垂直居中
@include flex-between; // 两端对齐
@include flex-column; // 垂直布局
@include flex-column-center; // 垂直布局+居中
```

### 文本 Mixins

```scss
@include font-mono; // 等宽字体
@include font-system; // 系统字体
@include text-uppercase-spaced; // 大写+字母间距
@include text-small-caps; // 小型大写字母样式
```

### 组件 Mixins

```scss
@include button-base; // 基础按钮样式
@include button-primary; // 主要按钮样式
@include card-base; // 基础卡片样式
@include card-elevated; // 悬浮卡片样式
```

### 动画 Mixins

```scss
@include animation-pulse; // 脉冲动画
@include animation-rotate; // 旋转动画
@include transition-smooth; // 平滑过渡
```

### 滚动条 Mixins

```scss
@include scrollbar-thin; // 细滚动条
@include scrollbar-standard; // 标准滚动条
```

## 工具类

### 间距工具类

```scss
.p-xs, .p-sm, .p-md, .p-lg, .p-xl  // 内边距
.m-xs, .m-sm, .m-md, .m-lg, .m-xl  // 外边距
```

### 文本工具类

```scss
.text-xs, .text-sm, .text-md, .text-lg, .text-xl  // 字体大小
.text-primary, .text-muted, .text-light           // 文本颜色
.text-uppercase, .text-capitalize, .text-lowercase // 文本转换
```

### 布局工具类

```scss
.flex, .flex-center, .flex-between, .flex-column  // Flexbox
.transition, .transition-fast, .transition-slow   // 过渡动画
```

### 边框和形状工具类

```scss
.rounded-none, .rounded-sm, .rounded-md, .rounded-lg  // 边框半径
.border, .border-light, .border-dark                 // 边框
.shadow-sm, .shadow-md, .shadow-lg                   // 阴影
```

## 使用方法

### 1. 在组件中导入样式系统

```vue
<style lang="scss" scoped>
@use '@/styles/main.scss';

.my-component {
  @include card-base;
  padding: var(--space-lg);

  .title {
    @include text-uppercase-spaced;
    color: var(--color-text);
  }

  .button {
    @include button-primary;
  }
}
</style>
```

### 2. 使用工具类

```vue
<template>
  <div class="flex-center p-lg rounded-md shadow-md">
    <h1 class="text-xl text-primary">标题</h1>
    <button class="transition">按钮</button>
  </div>
</template>
```

### 3. 响应式设计

```scss
.my-component {
  padding: var(--space-lg);

  @include mobile {
    padding: var(--space-sm);
  }

  @include tablet {
    padding: var(--space-md);
  }
}
```

## 组件样式重构

所有组件已经重构为使用新的样式系统：

- **App.vue**: 主应用布局
- **focusExplorer.vue**: 焦点探索器
- **blockViewer.vue**: 块查看器
- **relationViewer.vue**: 关系查看器
- **blockEditor.vue**: 块编辑器

## 优势

1. **一致性**: 所有组件使用统一的设计令牌
2. **可维护性**: 集中管理颜色、间距、字体等
3. **灵活性**: 通过 mixins 和工具类快速开发
4. **响应式**: 内置响应式设计支持
5. **性能**: 优化的 CSS 输出，避免重复代码
6. **开发体验**: 语义化的类名和 mixins

## 扩展

要添加新的设计令牌或 mixins，只需在相应的 SCSS 文件中添加即可，所有组件会自动继承新的样式。
