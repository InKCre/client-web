import { z } from "zod";
import { apiClient } from "./client";
import { Block } from "./models";
import {
  BlockSchema,
  BlockIterationResponseSchema,
  type CreateBlockRequest,
  type UpdateBlockRequest,
  type GetRecentBlocksParams,
  type GetBlocksByEmbeddingParams,
  type GetBlockIterationParams,
  type BlockIterationResponse,
} from "./schemas";

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
    const response = await apiClient.postWithValidation("/blocks", BlockSchema, data, { organize });
    return new Block(response);
  }

  /**
   * 获取指定块
   * @param blockId 块ID
   */
  async getBlock(blockId: number): Promise<Block> {
    const response = await apiClient.getWithValidation(`/blocks/${blockId}`, BlockSchema);
    return new Block(response);
  }

  /**
   * 更新块
   * @param blockId 块ID
   * @param data 更新数据
   */
  async updateBlock(blockId: number, data: UpdateBlockRequest): Promise<Block> {
    const response = await apiClient.patchWithValidation(`/blocks/${blockId}`, BlockSchema, data);
    return new Block(response);
  }

  /**
   * 获取最近创建的块
   * @param params 查询参数
   */
  async getRecentBlocks(params?: GetRecentBlocksParams): Promise<Block[]> {
    const response = await apiClient.getWithValidation(
      "/blocks/recent",
      z.array(BlockSchema),
      params,
    );
    return response.map((data) => new Block(data));
  }

  /**
   * 向量检索块
   * @param params 检索参数
   */
  async getBlocksByEmbedding(params: GetBlocksByEmbeddingParams): Promise<Block[]> {
    const response = await apiClient.getWithValidation(
      "/blocks/by_embedding",
      z.array(BlockSchema),
      params,
    );
    return response.map((data) => new Block(data));
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
    return apiClient.getWithValidation(
      `/blocks/${blockId}/iteration`,
      BlockIterationResponseSchema,
      params,
    );
  }
}

// 创建默认实例
export const blocksApi = new BlocksApi();
