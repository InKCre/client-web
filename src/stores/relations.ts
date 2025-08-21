import { defineStore } from 'pinia'
import type { Relation } from '../types/relations'

export const useRelationsStore = defineStore('relations', {
  state: () => ({
    relations: [
      {
        id: 1,
        updated_at: '2025-08-21T09:10:00Z',
        from_: 1,
        to_: 2,
        content: '示例关系 1-2',
      },
      {
        id: 2,
        updated_at: '2025-08-21T09:11:00Z',
        from_: 2,
        to_: 1,
        content: '示例关系 2-1',
      },
    ] as Relation[],
  }),
  getters: {
    getByBlock: (state) => (blockId: number, to: boolean) =>
      to
        ? state.relations.filter((r) => r.from_ === blockId)
        : state.relations.filter((r) => r.to_ === blockId),
  },
})
