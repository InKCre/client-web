import type { NodeProps } from '@vue-flow/core'
import type { BlockNodeData } from '@inkcre/core'

export type BlockNodeProps = NodeProps<BlockNodeData>

export const blockNodeEmits = {
  select: (_blockId: number) => true,
} as const
