import { apiClient } from './client'
import type {
  Block,
  CreateBlockRequest,
  UpdateBlockRequest,
  GetRecentBlocksParams,
  GetBlocksByEmbeddingParams,
  GetBlockIterationParams,
  BlockIterationResponse,
} from './types'

/**
 * Block相关的API方法
 */
export class BlocksApi {
  /**
   * 创建块
   * @param data 创建块的数据
   * @param organize 是否自动整理，默认为true
   */
  async createBlock(data: CreateBlockRequest, organize: boolean = true): Promise<Block> {
    return apiClient.post<Block>('/blocks', data, { organize })
  }

  /**
   * 获取指定块
   * @param blockId 块ID
   */
  async getBlock(blockId: number): Promise<Block> {
    return apiClient.get<Block>(`/blocks/${blockId}`)
  }

  /**
   * 更新块
   * @param blockId 块ID
   * @param data 更新数据
   */
  async updateBlock(blockId: number, data: UpdateBlockRequest): Promise<Block> {
    return apiClient.patch<Block>(`/blocks/${blockId}`, data)
  }

  /**
   * 获取最近创建的块
   * @param params 查询参数
   */
  async getRecentBlocks(params?: GetRecentBlocksParams): Promise<Block[]> {
    return apiClient.get<Block[]>('/blocks/recent', params)
  }

  /**
   * 向量检索块
   * @param params 检索参数
   */
  async getBlocksByEmbedding(
    params: GetBlocksByEmbeddingParams,
  ): Promise<(Block | import('./types').Relation)[]> {
    return apiClient.get<(Block | import('./types').Relation)[]>('/blocks/by_embedding', params)
  }

  /**
   * 块遍历
   * @param blockId 起始块ID
   * @param params 遍历参数
   */
  async getBlockIteration(
    blockId: number,
    params?: GetBlockIterationParams,
  ): Promise<BlockIterationResponse> {
    return apiClient.get<BlockIterationResponse>(`/blocks/${blockId}/iteration`, params)
  }
}

// 创建默认实例
export const blocksApi = new BlocksApi()
