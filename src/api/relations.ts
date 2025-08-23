import { z } from "zod";
import { apiClient } from "./client";
import { Relation } from "./models";
import { RelationSchema, type CreateRelationRequest } from "./schemas";

/**
 * Relation相关的API方法
 */
export class RelationsApi {
  /**
   * 创建关系
   * @param data 创建关系的数据
   */
  async createRelation(data: CreateRelationRequest): Promise<Relation> {
    const response = await apiClient.postWithValidation("/relation", RelationSchema, data);
    return new Relation(response);
  }

  /**
   * 获取指定关系
   * @param relationId 关系ID
   */
  async getRelation(relationId: number): Promise<Relation> {
    const response = await apiClient.getWithValidation(`/relation/${relationId}`, RelationSchema);
    return new Relation(response);
  }

  /**
   * 获取块之间的关系
   * @param fromBlockId 起始块ID
   * @param toBlockId 目标块ID（可选）
   */
  async getRelationsBetweenBlocks(fromBlockId: number, toBlockId?: number): Promise<Relation[]> {
    const params: Record<string, any> = { from_: fromBlockId };
    if (toBlockId !== undefined) {
      params.to_ = toBlockId;
    }
    const response = await apiClient.getWithValidation(
      "/relations",
      z.array(RelationSchema),
      params,
    );
    return response.map((data) => new Relation(data));
  }

  /**
   * 获取块的所有关系（包括作为起点和终点的关系）
   * @param blockId 块ID
   */
  async getBlockRelations(blockId: number): Promise<{
    outgoing: Relation[];
    incoming: Relation[];
  }> {
    // 使用新的 API 接口获取块的所有关系
    const response = await apiClient.getWithValidation(
      `/relations/by_block/${blockId}`,
      z.array(RelationSchema),
    );
    const relations = response.map((data) => new Relation(data));

    // 根据 from_ 和 to_ 字段分离出向和入向关系
    const outgoing = relations.filter((relation) => relation.from_ === blockId);
    const incoming = relations.filter((relation) => relation.to_ === blockId);

    return { outgoing, incoming };
  }

  /**
   * 删除关系
   * @param relationId 关系ID
   */
  async deleteRelation(relationId: number): Promise<void> {
    await apiClient.delete(`/relation/${relationId}`);
  }

  /**
   * 更新关系内容
   * @param relationId 关系ID
   * @param content 新的关系内容
   */
  async updateRelation(relationId: number, content: string): Promise<Relation> {
    const response = await apiClient.patchWithValidation(
      `/relation/${relationId}`,
      RelationSchema,
      { content },
    );
    return new Relation(response);
  }
}

// 创建默认实例
export const relationsApi = new RelationsApi();
