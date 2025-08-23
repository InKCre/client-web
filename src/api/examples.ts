/**
 * API使用示例
 *
 * 本文件展示如何在Vue组件中使用API客户端
 */

import { ref, onMounted } from 'vue'
import { api } from '@/api'
import type { Block, Relation } from '@/api'

/**
 * 组件示例：使用Block API
 */
export function useBlocksExample() {
  const blocks = ref<Block[]>([])
  const currentBlock = ref<Block | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取最近的块
  const fetchRecentBlocks = async (num: number = 10) => {
    try {
      loading.value = true
      error.value = null
      blocks.value = await api.blocks.getRecentBlocks({ num })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取块失败'
      console.error('获取最近块失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取指定块
  const fetchBlock = async (blockId: number) => {
    try {
      loading.value = true
      error.value = null
      currentBlock.value = await api.blocks.getBlock(blockId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取块失败'
      console.error('获取块失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 创建新块
  const createBlock = async (
    content: string,
    resolver: string = 'text',
    storage: 'url' | null = null,
  ) => {
    try {
      loading.value = true
      error.value = null
      const newBlock = await api.blocks.createBlock({
        content,
        resolver,
        storage,
      })
      // 将新块添加到列表开头
      blocks.value.unshift(newBlock)
      return newBlock
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建块失败'
      console.error('创建块失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新块
  const updateBlock = async (
    blockId: number,
    updates: Partial<Pick<Block, 'content' | 'resolver' | 'storage'>>,
  ) => {
    try {
      loading.value = true
      error.value = null

      const currentBlockData = await api.blocks.getBlock(blockId)
      const updatedBlock = await api.blocks.updateBlock(blockId, {
        id: currentBlockData.id,
        updated_at: currentBlockData.updated_at,
        ...updates,
      })

      // 更新列表中的块
      const index = blocks.value.findIndex((b) => b.id === blockId)
      if (index !== -1) {
        blocks.value[index] = updatedBlock
      }

      if (currentBlock.value?.id === blockId) {
        currentBlock.value = updatedBlock
      }

      return updatedBlock
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新块失败'
      console.error('更新块失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 向量检索相关块
  const searchSimilarBlocks = async (blockId: number, num: number = 10) => {
    try {
      loading.value = true
      error.value = null
      const results = await api.blocks.getBlocksByEmbedding({ block_id: blockId, num })
      return results.filter((item): item is Block => 'resolver' in item) // 过滤出Block类型
    } catch (err) {
      error.value = err instanceof Error ? err.message : '检索相关块失败'
      console.error('检索相关块失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    blocks,
    currentBlock,
    loading,
    error,
    fetchRecentBlocks,
    fetchBlock,
    createBlock,
    updateBlock,
    searchSimilarBlocks,
  }
}

/**
 * 组件示例：使用Relation API
 */
export function useRelationsExample() {
  const relations = ref<Relation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 创建关系
  const createRelation = async (fromBlockId: number, toBlockId: number, content: string) => {
    try {
      loading.value = true
      error.value = null
      const newRelation = await api.relations.createRelation({
        from_: fromBlockId,
        to_: toBlockId,
        content,
      })
      relations.value.push(newRelation)
      return newRelation
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建关系失败'
      console.error('创建关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取块的所有关系
  const fetchBlockRelations = async (blockId: number) => {
    try {
      loading.value = true
      error.value = null
      const blockRelations = await api.relations.getBlockRelations(blockId)
      relations.value = [...blockRelations.outgoing, ...blockRelations.incoming]
      return blockRelations
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取关系失败'
      console.error('获取关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除关系
  const deleteRelation = async (relationId: number) => {
    try {
      loading.value = true
      error.value = null
      await api.relations.deleteRelation(relationId)
      // 从列表中移除
      relations.value = relations.value.filter((r) => r.id !== relationId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除关系失败'
      console.error('删除关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    relations,
    loading,
    error,
    createRelation,
    fetchBlockRelations,
    deleteRelation,
  }
}

/**
 * 完整的使用示例组件
 */
export function useInKCreApi() {
  const blocksApi = useBlocksExample()
  const relationsApi = useRelationsExample()

  // 初始化数据
  const initialize = async () => {
    await blocksApi.fetchRecentBlocks()
  }

  // 在组件挂载时初始化
  onMounted(() => {
    initialize()
  })

  return {
    blocks: blocksApi,
    relations: relationsApi,
    initialize,
  }
}
