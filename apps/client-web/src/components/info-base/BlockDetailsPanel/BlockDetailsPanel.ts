import type { Block } from "@inkcre/core";
import type { Relation } from "@inkcre/core";

export interface BlockDetailsPanelProps {
  block: Block;
  relations?: Relation[];
}

export const blockDetailsPanelEmits = {
  close: () => true,
} as const;
