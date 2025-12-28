import type { NodeProps } from "@vue-flow/core";
import type { BlockNodeData } from "@/business/info-base/graph/graph-types";

export type BlockNodeProps = NodeProps<BlockNodeData>;

export const blockNodeEmits = {
  select: (blockId: number) => true,
} as const;
