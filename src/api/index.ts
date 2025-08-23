// 导出API客户端
export { ApiClient, apiClient } from './client'

// 导出API类和实例
export { BlocksApi, blocksApi } from './blocks'
export { RelationsApi, relationsApi } from './relations'

// 导出组合式函数
export { useBlocks, useRelations, useInKCreAPI } from './composables'

// 导出类型定义
export type * from './types'

// 导入实例以创建统一的API对象
import { blocksApi } from './blocks'
import { relationsApi } from './relations'

// 创建统一的API对象
export const api = {
  blocks: blocksApi,
  relations: relationsApi,
}
