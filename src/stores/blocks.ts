import { defineStore } from 'pinia'
import type { Block } from '../types/blocks'

export const useBlocksStore = defineStore('blocks', {
  state: () => ({
    blocks: [
      {
        id: 1,
        updated_at: '2025-08-21T09:00:00Z',
        storage: null,
        resolver: 'text',
        content: '示例块 1',
        embedding: null,
      },
      {
        id: 2,
        updated_at: '2025-08-21T09:01:00Z',
        storage: null,
        resolver: 'text',
        content: '示例块 2',
        embedding: null,
      },
    ] as Block[],
  }),
  getters: {
    getById: (state) => (id: number) => state.blocks.find((b) => b.id === id),
  },
})
