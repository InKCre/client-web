import { apiClient } from './client'
import type { Relation, CreateRelationRequest } from './types'

/**
 * Relation相关的API方法
 */
export class RelationsApi {
  /**
   * 创建关系
   * @param data 创建关系的数据
   */
  async createRelation(data: CreateRelationRequest): Promise<Relation> {
    return apiClient.post<Relation>('/relation', data)
  }

  /**
   * 获取指定关系
   * @param relationId 关系ID
   */
  async getRelation(relationId: number): Promise<Relation> {
    return apiClient.get<Relation>(`/relation/${relationId}`)
  }

  /**
   * 获取块之间的关系
   * @param fromBlockId 起始块ID
   * @param toBlockId 目标块ID（可选）
   */
  async getRelationsBetweenBlocks(fromBlockId: number, toBlockId?: number): Promise<Relation[]> {
    const params: Record<string, any> = { from_: fromBlockId }
    if (toBlockId !== undefined) {
      params.to_ = toBlockId
    }
    return apiClient.get<Relation[]>('/relations', params)
  }

  /**
   * 获取块的所有关系（包括作为起点和终点的关系）
   * @param blockId 块ID
   */
  async getBlockRelations(blockId: number): Promise<{
    outgoing: Relation[]
    incoming: Relation[]
  }> {
    // 使用新的 API 接口获取块的所有关系
    const relations = await apiClient.get<Relation[]>(`/relations/by_block/${blockId}`)

    // 根据 from_ 和 to_ 字段分离出向和入向关系
    const outgoing = relations.filter((relation) => relation.from_ === blockId)
    const incoming = relations.filter((relation) => relation.to_ === blockId)

    return { outgoing, incoming }
  }

  /**
   * 删除关系
   * @param relationId 关系ID
   */
  async deleteRelation(relationId: number): Promise<void> {
    return apiClient.delete<void>(`/relation/${relationId}`)
  }

  /**
   * 更新关系内容
   * @param relationId 关系ID
   * @param content 新的关系内容
   */
  async updateRelation(relationId: number, content: string): Promise<Relation> {
    return apiClient.patch<Relation>(`/relation/${relationId}`, { content })
  }
}

// 创建默认实例
export const relationsApi = new RelationsApi()
