import type { Block } from "@/business/info-base/block";

export interface BlockDetailsPanelProps {
  block: Block;
}

export const blockDetailsPanelEmits = {
  close: () => true,
} as const;
