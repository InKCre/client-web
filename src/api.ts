/**
 * API barrel export file
 * Re-exports business layer modules for backward compatibility
 */

import { ref, computed } from 'vue'

// Re-export all from business layer
export * from './business/base'
export * from './business/block'
export * from './business/relation'

// For backward compatibility, create a default api object
import { Block } from './business/block'
import { Relation } from './business/relation'
import { DBAPIClient, CoreAPIClient } from './business/base'
import { useAuthStore, createAuthStoreAdapter } from './stores/auth'

// Initialize API clients
function initializeAPI() {
  const authStore = useAuthStore()
  const authAdapter = createAuthStoreAdapter(authStore)
  
  Block.dbApi = new DBAPIClient(authAdapter)
  Block.coreApi = new CoreAPIClient(authAdapter)
  
  Relation.dbApi = new DBAPIClient(authAdapter)
  Relation.coreApi = new CoreAPIClient(authAdapter)
}

// Export a default api object with initialized clients
export const api = {
  Block,
  Relation,
  initialize: initializeAPI,
  blocks: {
    async getAll(options?: any) {
      return await Block.getAll(options) as any
    },
    async getById(id: number) {
      return await Block.getById(id) as any
    },
    async getBlock(id: number) {
      return await Block.getById(id) as any
    },
    async create(data: { resolver: string; content: string; storage?: 'url' | null }) {
      return await Block.create(data) as any
    },
    async updateBlock(id: number, data: { resolver?: string; content?: string; storage?: 'url' | null }) {
      const block = await Block.getById(id)
      if (!block) throw new Error(`Block ${id} not found`)
      
      if (data.resolver !== undefined) block.resolver = data.resolver
      if (data.content !== undefined) block.content = data.content
      if (data.storage !== undefined) block.storage = data.storage
      
      return await block.save() as any
    },
    async delete(id: number) {
      const block = await Block.getById(id)
      if (!block) throw new Error(`Block ${id} not found`)
      return await block.delete()
    },
  },
  relations: {
    async getAll(options?: any) {
      return await Relation.getAll(options) as any
    },
    async getById(id: number) {
      return await Relation.getById(id) as any
    },
    async getRelation(id: number) {
      return await Relation.getById(id) as any
    },
    async getByBlock(blockId: number, direction?: 'from' | 'to' | 'both') {
      return await Relation.getByBlock(blockId, direction) as any
    },
    async getBlockRelations(blockId: number, direction?: 'from' | 'to' | 'both') {
      const [outgoing, incoming] = await Promise.all([
        Relation.getOutgoing(blockId),
        Relation.getIncoming(blockId)
      ])
      return {
        outgoing: outgoing as any,
        incoming: incoming as any,
        all: [...outgoing, ...incoming] as any
      }
    },
    async create(data: { from_: number; to_: number; content: string }) {
      return await Relation.create(data) as any
    },
    async updateRelation(id: number, data: { from_?: number; to_?: number; content?: string } | string) {
      const relation = await Relation.getById(id)
      if (!relation) throw new Error(`Relation ${id} not found`)
      
      // Handle string argument (content only)
      if (typeof data === 'string') {
        relation.content = data
      } else {
        if (data.from_ !== undefined) relation.from_ = data.from_
        if (data.to_ !== undefined) relation.to_ = data.to_
        if (data.content !== undefined) relation.content = data.content
      }
      
      return await relation.save() as any
    },
    async deleteRelation(id: number) {
      const relation = await Relation.getById(id)
      if (!relation) throw new Error(`Relation ${id} not found`)
      return await relation.delete()
    },
  },
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Only initialize in browser context
  try {
    initializeAPI()
  } catch (error) {
    console.warn('Failed to auto-initialize API:', error)
  }
}

/**
 * Composable for managing InKCre API operations
 * Provides reactive state for blocks and relations
 */
export function useInKCreAPI() {
  // Create nested structure for blocks
  const blocksData = ref<Block[]>([])
  const blocksLoading = ref(false)
  
  // Create nested structure for relations  
  const relationsData = ref<Relation[]>([])
  const relationsLoading = ref(false)
  
  const isLoading = ref(false)
  const hasError = ref(false)
  const allErrors = ref<Error[]>([])

  // Blocks methods
  async function fetchRecentBlocks(limit: number = 20) {
    try {
      blocksLoading.value = true
      hasError.value = false
      blocksData.value = await Block.getAll({ limit, order: 'updated_at.desc' }) as any
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to load blocks:', error)
    } finally {
      blocksLoading.value = false
    }
  }

  async function createBlock(data: { resolver: string; content: string; storage?: 'url' | null }) {
    try {
      const block = await Block.create(data) as any
      blocksData.value.unshift(block)
      return block
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to create block:', error)
      throw error
    }
  }

  async function deleteBlock(blockId: number) {
    try {
      const block = blocksData.value.find(b => b.id === blockId)
      if (block) {
        await block.delete()
        blocksData.value = blocksData.value.filter(b => b.id !== blockId)
      }
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to delete block:', error)
      throw error
    }
  }

  // Relations methods
  async function fetchRelations() {
    try {
      relationsLoading.value = true
      hasError.value = false
      relationsData.value = await Relation.getAll() as any
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to load relations:', error)
    } finally {
      relationsLoading.value = false
    }
  }

  async function createRelation(data: { from_: number; to_: number; content: string }) {
    try {
      const relation = await Relation.create(data) as any
      relationsData.value.push(relation)
      return relation
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to create relation:', error)
      throw error
    }
  }

  async function deleteRelation(relationId: number) {
    try {
      const relation = relationsData.value.find(r => r.id === relationId)
      if (relation) {
        await relation.delete()
        relationsData.value = relationsData.value.filter(r => r.id !== relationId)
      }
    } catch (error) {
      hasError.value = true
      allErrors.value.push(error as Error)
      console.error('Failed to delete relation:', error)
      throw error
    }
  }

  // Load all data
  async function loadAll() {
    try {
      isLoading.value = true
      hasError.value = false
      allErrors.value = []
      
      const [blocksResult, relationsResult] = await Promise.all([
        Block.getAll().catch(err => {
          allErrors.value.push(err)
          return []
        }),
        Relation.getAll().catch(err => {
          allErrors.value.push(err)
          return []
        })
      ])
      
      blocksData.value = blocksResult as any
      relationsData.value = relationsResult as any
      
      if (allErrors.value.length > 0) {
        hasError.value = true
      }
    } finally {
      isLoading.value = false
    }
  }

  // Create nested objects with properties and methods
  const blocks = {
    blocks: blocksData,
    loading: blocksLoading,
    fetchRecentBlocks,
    createBlock,
    deleteBlock,
  }

  const relations = {
    relations: relationsData,
    loading: relationsLoading,
    fetchRelations,
    createRelation,
    deleteRelation,
  }

  return {
    blocks,
    relations,
    isLoading,
    hasError,
    allErrors,
    loadAll,
  }
}

