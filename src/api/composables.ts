import { ref, computed } from "vue";
import { api } from "@/api";
import { Block, Relation } from "./models";
import type { CreateBlockRequest, CreateRelationRequest } from "./schemas";

/**
 * 组合式函数：管理Block的CRUD操作
 */
export function useBlocks() {
  const blocks = ref<Block[]>([]);
  const currentBlock = ref<Block | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 获取最近的块
  const fetchRecentBlocks = async (num: number = 10, resolver?: string) => {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.blocks.getRecentBlocks({ num, resolver });
      blocks.value = result;
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取块失败";
      console.error("获取最近块失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取指定块
  const fetchBlock = async (blockId: number) => {
    try {
      loading.value = true;
      error.value = null;
      const block = await api.blocks.getBlock(blockId);
      currentBlock.value = block;
      return block;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取块失败";
      console.error("获取块失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 创建新块
  const createBlock = async (data: CreateBlockRequest, organize: boolean = true) => {
    try {
      loading.value = true;
      error.value = null;
      const newBlock = await api.blocks.createBlock(data, organize);
      // 将新块添加到列表开头
      blocks.value.unshift(newBlock);
      return newBlock;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建块失败";
      console.error("创建块失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新块
  const updateBlock = async (
    blockId: number,
    updates: Partial<Pick<Block, "content" | "resolver" | "storage">>,
  ) => {
    try {
      loading.value = true;
      error.value = null;

      const currentBlockData = await api.blocks.getBlock(blockId);
      const updatedBlock = await api.blocks.updateBlock(blockId, {
        id: currentBlockData.id,
        updated_at: currentBlockData.updated_at,
        ...updates,
      });

      // 更新列表中的块
      const index = blocks.value.findIndex((b) => b.id === blockId);
      if (index !== -1) {
        blocks.value[index] = updatedBlock;
      }

      if (currentBlock.value?.id === blockId) {
        currentBlock.value = updatedBlock;
      }

      return updatedBlock;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新块失败";
      console.error("更新块失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 向量检索相关块
  const searchSimilarBlocks = async (blockId: number, num: number = 10) => {
    try {
      loading.value = true;
      error.value = null;
      const results = await api.blocks.getBlocksByEmbedding({ block_id: blockId, num });
      return results.filter((item): item is Block => "resolver" in item); // 过滤出Block类型
    } catch (err) {
      error.value = err instanceof Error ? err.message : "检索相关块失败";
      console.error("检索相关块失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 块遍历
  const iterateBlock = async (
    blockId: number,
    excludeStart: boolean = true,
    maxDepth: number = 3,
  ) => {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.blocks.getBlockIteration(blockId, {
        exclude_start_block: excludeStart,
        max_depth: maxDepth,
      });
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "块遍历失败";
      console.error("块遍历失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

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
    iterateBlock,
  };
}

/**
 * 组合式函数：管理Relation的CRUD操作
 */
export function useRelations() {
  const relations = ref<Relation[]>([]);
  const blockRelations = ref<{ outgoing: Relation[]; incoming: Relation[] } | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 创建关系
  const createRelation = async (data: CreateRelationRequest) => {
    try {
      loading.value = true;
      error.value = null;
      const newRelation = await api.relations.createRelation(data);
      relations.value.push(newRelation);
      return newRelation;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "创建关系失败";
      console.error("创建关系失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取块的所有关系
  const fetchBlockRelations = async (blockId: number) => {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.relations.getBlockRelations(blockId);
      blockRelations.value = result;
      relations.value = [...result.outgoing, ...result.incoming];
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取关系失败";
      console.error("获取关系失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 获取块之间的关系
  const fetchRelationsBetween = async (fromBlockId: number, toBlockId?: number) => {
    try {
      loading.value = true;
      error.value = null;
      const result = await api.relations.getRelationsBetweenBlocks(fromBlockId, toBlockId);
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "获取关系失败";
      console.error("获取关系失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 更新关系
  const updateRelation = async (relationId: number, content: string) => {
    try {
      loading.value = true;
      error.value = null;
      const updatedRelation = await api.relations.updateRelation(relationId, content);

      // 更新列表中的关系
      const index = relations.value.findIndex((r) => r.id === relationId);
      if (index !== -1) {
        relations.value[index] = updatedRelation;
      }

      // 更新块关系中的数据
      if (blockRelations.value) {
        const outIndex = blockRelations.value.outgoing.findIndex((r) => r.id === relationId);
        if (outIndex !== -1) {
          blockRelations.value.outgoing[outIndex] = updatedRelation;
        }

        const inIndex = blockRelations.value.incoming.findIndex((r) => r.id === relationId);
        if (inIndex !== -1) {
          blockRelations.value.incoming[inIndex] = updatedRelation;
        }
      }

      return updatedRelation;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "更新关系失败";
      console.error("更新关系失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除关系
  const deleteRelation = async (relationId: number) => {
    try {
      loading.value = true;
      error.value = null;
      await api.relations.deleteRelation(relationId);

      // 从列表中移除
      relations.value = relations.value.filter((r) => r.id !== relationId);

      // 从块关系中移除
      if (blockRelations.value) {
        blockRelations.value.outgoing = blockRelations.value.outgoing.filter(
          (r) => r.id !== relationId,
        );
        blockRelations.value.incoming = blockRelations.value.incoming.filter(
          (r) => r.id !== relationId,
        );
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "删除关系失败";
      console.error("删除关系失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    relations,
    blockRelations,
    loading,
    error,
    createRelation,
    fetchBlockRelations,
    fetchRelationsBetween,
    updateRelation,
    deleteRelation,
  };
}

/**
 * 组合式函数：综合的InKCre API操作
 */
export function useInKCreAPI() {
  const blocksComposable = useBlocks();
  const relationsComposable = useRelations();

  // 综合的加载状态
  const isLoading = computed(
    () => blocksComposable.loading.value || relationsComposable.loading.value,
  );

  // 综合的错误状态
  const hasError = computed(
    () => !!blocksComposable.error.value || !!relationsComposable.error.value,
  );

  const allErrors = computed(() =>
    [blocksComposable.error.value, relationsComposable.error.value].filter(Boolean).join("; "),
  );

  return {
    // Blocks相关
    blocks: blocksComposable,

    // Relations相关
    relations: relationsComposable,

    // 综合状态
    isLoading,
    hasError,
    allErrors,
  };
}
