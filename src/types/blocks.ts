// Re-export Block from business layer for backward compatibility
import type { Block as BlockClass, BlockRef, BlockType } from '../business/block'
export type { BlockRef, BlockType } from '../business/block'
export { BlockZ, BlockProp } from '../business/block'

// For components, Block from DB will always have id and updated_at
export type Block = BlockClass & Required<Pick<BlockClass, 'id' | 'updated_at'>>

