# InKCre API 客户端

这个模块提供了与InKCre后端API交互的客户端库。

## 功能特性

- ✅ 支持Block和Relation相关的所有API端点
- ✅ TypeScript支持，完整的类型定义
- ✅ 统一的错误处理
- ✅ 可配置的API基础URL
- ✅ 组合式API设计，易于在Vue组件中使用

## 文件结构

```
src/api/
├── index.ts          # 主入口文件，导出所有API
├── client.ts         # HTTP客户端基础类
├── config.ts         # API配置
├── types.ts          # 类型定义
├── blocks.ts         # Block相关API方法
├── relations.ts      # Relation相关API方法
└── examples.ts       # 使用示例和组合式函数
```

## 基本使用

### 直接使用API方法

```typescript
import { api } from '@/api'

// 获取最近的块
const recentBlocks = await api.blocks.getRecentBlocks({ num: 10 })

// 创建新块
const newBlock = await api.blocks.createBlock({
  content: 'Hello, World!',
  resolver: 'text',
  storage: null,
})

// 创建关系
const relation = await api.relations.createRelation({
  from_: 1,
  to_: 2,
  content: 'relates to',
})
```

### 在Vue组件中使用

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-if="error">{{ error }}</div>
    <div v-for="block in blocks" :key="block.id">
      {{ block.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBlocksExample } from '@/api/examples'

const { blocks, loading, error, fetchRecentBlocks, createBlock } = useBlocksExample()

// 组件挂载时获取数据
onMounted(() => {
  fetchRecentBlocks(10)
})
</script>
```

## API参考

### Blocks API

- `createBlock(data, organize?)` - 创建新块
- `getBlock(blockId)` - 获取指定块
- `updateBlock(blockId, data)` - 更新块
- `getRecentBlocks(params?)` - 获取最近创建的块
- `getBlocksByEmbedding(params)` - 向量检索块
- `getBlockIteration(blockId, params?)` - 块遍历

### Relations API

- `createRelation(data)` - 创建关系
- `getRelation(relationId)` - 获取指定关系
- `getRelationsBetweenBlocks(fromBlockId, toBlockId?)` - 获取块之间的关系
- `getBlockRelations(blockId)` - 获取块的所有关系
- `deleteRelation(relationId)` - 删除关系
- `updateRelation(relationId, content)` - 更新关系

## 配置

### 环境变量

在 `.env` 文件中设置API基础URL：

```
VITE_API_BASE_URL=http://localhost:8000
```

### 默认配置

- 开发环境: `http://localhost:8000`
- 生产环境: `https://api.inkcre.com`
- 请求超时: 10秒
- 默认分页大小: 10

## 错误处理

所有API方法都会抛出错误，建议使用try-catch进行处理：

```typescript
try {
  const block = await api.blocks.getBlock(1)
} catch (error) {
  console.error('获取块失败:', error)
  // 处理错误
}
```

## 类型定义

所有API相关的类型都可以从主入口导入：

```typescript
import type { Block, Relation, CreateBlockRequest, CreateRelationRequest } from '@/api'
```

## 使用建议

1. **不使用状态管理**: 根据项目要求，直接在组件中使用API，不通过Pinia等状态管理库
2. **错误处理**: 每个API调用都应该有适当的错误处理
3. **加载状态**: 使用loading状态改善用户体验
4. **类型安全**: 充分利用TypeScript的类型检查
5. **组合式函数**: 使用examples.ts中的组合式函数来简化组件逻辑

## 扩展

如需添加新的API端点：

1. 在对应的API类中添加新方法
2. 更新types.ts中的类型定义
3. 在examples.ts中添加使用示例（可选）
