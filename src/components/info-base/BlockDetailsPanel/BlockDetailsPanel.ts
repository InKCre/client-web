import type { Block } from "@/business/info-base/block";
import type { Relation } from "@/business/info-base/relation";

export interface BlockDetailsPanelProps {
  block: Block;
  relations?: Relation[];
}

export const blockDetailsPanelEmits = {
  close: () => true,
} as const;
