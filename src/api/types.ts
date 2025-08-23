import type { Block } from '@/types/blocks'
import type { Relation } from '@/types/relations'

/**
 * 创建块的请求参数
 */
export interface CreateBlockRequest {
  storage: 'url' | null
  resolver: string
  content: string
}

/**
 * 更新块的请求参数
 */
export interface UpdateBlockRequest {
  id: number
  updated_at: string
  storage?: 'url' | null
  resolver?: string
  content?: string
}

/**
 * 创建关系的请求参数
 */
export interface CreateRelationRequest {
  from_: number
  to_: number
  content: string
}

/**
 * 获取最近块的查询参数
 */
export interface GetRecentBlocksParams {
  num?: number
  resolver?: string
}

/**
 * 向量检索块的查询参数
 */
export interface GetBlocksByEmbeddingParams {
  block_id: number
  num?: number
}

/**
 * 块遍历的查询参数
 */
export interface GetBlockIterationParams {
  exclude_start_block?: boolean
  max_depth?: number
}

/**
 * 块遍历的响应结果
 */
export interface BlockIterationResponse {
  blocks: number[]
  relations: number[]
}

/**
 * API响应包装类型
 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 分页响应结果
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// 重新导出类型
export type { Block, Relation }
