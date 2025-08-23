# BlockViewer 组件

用于显示块信息的可复用组件，支持多种显示模式。

## 功能特性

- 支持多种内容类型（文本、图片、URL等）
- 响应式设计
- 可配置显示模式
- 内容自动截断
- 加载和错误状态处理

## Props

```typescript
interface BlockViewerProps {
  blockId: number // 块ID（必需）
  mode?: 'default' | 'compact' | 'preview' // 显示模式
  showDetails?: boolean // 是否显示详细信息
}
```

## 显示模式

### default 模式

- 标准显示模式
- 完整的内容显示
- 显示所有信息

### compact 模式

- 紧凑显示模式
- 减少内边距
- 较短的内容截断
- 适用于列表或侧边栏

### preview 模式

- 预览显示模式
- 中等长度的内容截断
- 适用于工作区网格显示

## 事件

- `click`: 点击时触发，传递 `(blockId: number, block?: Block)`

## 使用示例

### 基础使用

```vue
<block-viewer :block-id="123" />
```

### 工作区网格

```vue
<block-viewer :block-id="block.id" mode="preview" :show-details="false" @click="handleBlockClick" />
```

### 侧边栏列表

```vue
<block-viewer :block-id="block.id" mode="compact" :show-details="true" @click="handleBlockClick" />
```

## 内容类型支持

- **text**: 纯文本内容
- **image**: 图片内容（自动优化显示）
- **url**: 链接内容（可点击跳转）
- **其他**: 通用显示格式

## 响应式特性

组件会根据屏幕大小自动调整显示效果，在移动设备上会适当调整内边距和字体大小。

## TODO

- [ ] 保存、创建块（已在其他组件中实现）
- [ ] 删除块（通过上下文菜单）
- [ ] 修改块的解析器类型（通过编辑模式）
- [ ] 修改块的存储器类型（通过编辑模式）
- [ ] 添加拖拽支持
- [ ] 添加键盘导航
