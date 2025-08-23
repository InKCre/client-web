import type { Block } from '@/types/blocks'

export type BlockViewerProps = {
  // 提供完整 block 对象或 blockId（二选一）。两者都提供时优先使用 block。
  block?: Block | null
  blockId?: number | null
  mode?: 'default' | 'compact' | 'preview'
  showDetails?: boolean
}
